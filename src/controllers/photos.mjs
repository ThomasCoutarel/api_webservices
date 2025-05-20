import PhotoModel from '../models/photto.mjs';
import authenticateToken from '../middleware/jwt.mjs';
import generalLimiter from '../middleware/limiter.mjs';

class Photos {
  constructor(app, connect) {
    this.app = app;
    this.PhotoModel = connect.model('Photo', PhotoModel);
    this.run();
  }

  showById() {
    this.app.get('/photo/:id', generalLimiter, authenticateToken, async (req, res) => {
      try {
        const photoDoc = await this.PhotoModel.findById(req.params.id).populate('album');
        if (!photoDoc) {
          return res.status(404).json({ message: 'Photos not found' });
        }

        const photo = photoDoc.toObject();

        if (photo.album && photo.album.photos) {
          delete photo.album.photos;
        }
        return res.status(200).json(photo);
      } catch (err) {
        console.error(`[ERROR] photo/:id -> ${err}`);
        return res.status(500).json({ message: 'internal server error' });
      }
    });
  }

  create() {
    this.app.post('/photo', generalLimiter, authenticateToken, (req, res) => {
      try {
        const photo = new this.PhotoModel(req.body);
        photo.save()
          .then((savedPhoto) => savedPhoto.populate('album'))
          .then((populatedPhoto) => {
            res.status(201).json(populatedPhoto);
          })
          .catch((err) => {
            console.error(`[ERROR] photo/create -> ${err}`);
            res.status(400).json({ message: 'bad request' });
          });
      } catch (err) {
        console.error(`[ERROR] photo/create (catch global) -> ${err}`);
        res.status(500).json({ message: 'internal server error' });
      }
    });
  }

  async deleteById() {
    this.app.delete('/photo/:id', generalLimiter, authenticateToken, async (req, res) => {
      try {
        const photo = await this.PhotoModel.findByIdAndDelete(req.params.id);

        if (!photo) {
          return res.status(404).json({ message: 'Photos not found' });
        }

        return res.json({ message: 'Photos deleted' });
      } catch (err) {
        console.error(`[ERROR] photo/:id -> ${err}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
  }

  updateById() {
    this.app.put('/photo/:id', generalLimiter, authenticateToken, (req, res) => {
      try {
        const photoId = req.params.id;
        return this.PhotoModel.findByIdAndUpdate(photoId, req.body, { new: true })
          .then((photo) => {
            if (!photo) {
              return res.status(404).json({
                code: 404,
                message: 'Photos not found'
              });
            }
            return res.status(200).json(photo);
          })
          .catch((err) => {
            console.error('[ERROR] update photo/:id ->', err);
            return res.status(500).json({
              code: 500,
              message: 'internal server error',
              error: err.message
            });
          });
      } catch (err) {
        console.error('[ERROR] photo/:id (global catch) ->', err);
        return res.status(400).json({
          code: 400,
          message: 'bad request'
        });
      }
    });
  }

  run() {
    this.create();
    this.showById();
    this.deleteById();
    this.updateById();
  }
}

export default Photos;
