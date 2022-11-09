import { ObjectId } from 'mongodb';
import { findOne, find, insertOne, updateOne, replaceOne, startSession } from '../db';
import { apply, PatchTestFailed, PatchConflictError, InvalidPatchError } from 'json-patch';
import errorResponses from '../errorResponses.json';
import { sendChunked } from './helpers';

const transactionOptions = {
  readPreference: 'primary',
  readConcern: { level: 'local' },
  writeConcern: { w: 'majority' },
};

class ControllerBase {
  collection;
  auditCollection;
  defaultSort;

  constructor(collection, auditCollection, defaultSort) {
    this.collection = collection;
    this.auditCollection = auditCollection;
    this.defaultSort = defaultSort;
  }

  getEntity = async (req, res, next) => {
    try {
      const { params: { id }} = req;
      const filter = {
        _id: new ObjectId(id),
        $or: [
          { deleted: false },
          { deleted: { $exists: false }},
        ],
      };
      const entity = await findOne(this.collection, filter);
      if (entity) {
        res.status(200).send(entity);
      } else {
        res.status(404).send(errorResponses[404]);
      }
    } catch (error) {
      next(error);
    }
  };

  getAllEntities = async (_req, res, next) => {
    try {
      const cursor = find(this.collection, {
        $or: [
          { deleted: false },
          { deleted: { $exists: false }},
        ],
      }).sort(this.defaultSort);
      await sendChunked(cursor, res);
    } catch (error) {
      next(error);
    }
  };

  postEntity = async (req, res, next) => {
    try {
      const { body, user: { email }} = req;
      const _id = new ObjectId();
      const entity = {
        ...body,
        _id,
        version: 1,
      };
      const session = startSession();
      try {
        await session.withTransaction(async () => {
          await insertOne(this.collection, entity, { session });
          await insertOne(this.auditCollection, {
            _id: new ObjectId(),
            state: entity,
            dateTime: new Date(),
            user: email,
            operation: 'POST',
          }, { session });
        }, transactionOptions);
      } finally {
        await session.endSession();
      }
      res.status(201).send(entity);
    } catch (error) {
      next(error);
    }
  };

  putEntity = async (req, res, next) => {
    try {
      const {
        body: entity,
        body: { _id, version },
        user: { email },
        params: { id },
      } = req;

      if (id !== _id?.toString()) {
        res.status(400).send(errorResponses[400]);
        return;
      }

      let found = false;
      const session = startSession();
      try {
        await session.withTransaction(async () => {
          const { matchedCount, modifiedCount } = await replaceOne(
            this.collection,
            {
              _id,
              version,
              $or: [
                { deleted: false },
                { deleted: { $exists: false }},
              ],
            },
            { ...entity, version: version + 1 },
            { session },
          );
          found = matchedCount > 0;

          if (modifiedCount) {
            await insertOne(this.auditCollection,
              {
                _id: new ObjectId(),
                state: entity,
                dateTime: new Date(),
                user: email,
                operation: 'PUT',
              },
              { session },
            );
          }
        });
      } finally {
        session.endSession();
      }

      if (found) {
        res.status(200).send({
          status: 200,
          statusText: 'Success',
          entity: {
            ...entity,
            version: version + 1,
          },
        });
      } else {
        res.status(404).send(errorResponses[404]);
      }
    } catch (error) {
      next(error);
    }
  };

  patchEntity = async (req, res, next) => {
    try {
      try {
        const { body: patch, params: { id }, user: { email }} = req;
        const entity = await findOne(this.collection, { _id: new ObjectId(id) });
        if (entity) {
          apply(entity, patch);
          entity.version ++;
          const session = startSession();
          try {
            await session.withTransaction(async () => {
              await replaceOne(this.collection, entity, { session });
              await insertOne(this.auditCollection, {
                _id: new ObjectId(),
                state: entity,
                user: email,
                dateTime: new Date(),
                operation: 'PATCH',
                patch,
              }, { session });
            }, transactionOptions);
          } finally {
            await session.endSession();
          }
          res.status(200).send({
            status: 200,
            statusText: 'Success',
            entity,
          });
        } else {
          res.status(404).send(errorResponses[404]);
        }
      } catch (error) {
        if (error instanceof PatchTestFailed ||
            error instanceof PatchConflictError) {
          res.status(409).send(errorResponses[409]);
        } else if (error instanceof InvalidPatchError) {
          res.status(400).send(errorResponses[400]);
        } else {
          throw error;
        }
      }
    } catch (error) {
      next(error);
    }
  };

  deleteEntity = async (req, res, next) => {
    try {
      const { params: { id }, user: { email }} = req;
      const _id = new ObjectId(id);
      let found = false;

      const session = startSession();
      try {
        await session.withTransaction(async () => {
          const { modifiedCount } = await updateOne(
            this.collection,
            {
              _id,
              $or: [
                { deleted: false },
                { deleted: { $exists: false }},
              ],
            },
            { $set: { deleted: true }},
            { session },
          );
          found = modifiedCount > 0;
          if (found) {
            await insertOne(
              this.auditCollection,
              {
                _id: new ObjectId(),
                state: null,
                user: email,
                dateTime: new Date(),
                operation: 'DELETE',
              },
              {
                session,
              },
            );
          }
        });
      } finally {
        await session.endSession();
      }

      if (found) {
        res.sendStatus(204);
      } else {
        res.status(404).send(errorResponses[404]);
      }
    } catch (error) {
      next(error);
    }
  };
}

export default ControllerBase;
