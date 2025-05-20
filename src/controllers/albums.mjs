import AlbumModel from '../models/album.mjs';
import authenticateToken from '../middleware/jwt.mjs';
import generalLimiter from '../middleware/limiter.mjs';

const Albums = class Albums {
  constructor(app, connect) {
    this.app = app;
    this.AlbumModel = connect.model('Album', AlbumModel);

    this.run();
  }

  deleteById() {
    this.app.delete('/album/:id', generalLimiter, authenticateToken, (req, res) => {
      try {
        this.AlbumModel.findByIdAndDelete(req.params.id).populate('photos').then((album) => {
          res.status(200).json(album || {});
        }).catch(() => {
          res.status(500).json({
            code: 500,
            message: 'Internal Server error'
          });
        });
      } catch (err) {
        console.error(`[ERROR] album/:id -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  showById() {
    this.app.get('/album/:id', generalLimiter, authenticateToken, (req, res) => {
      try {
        this.AlbumModel.findById(req.params.id).then((album) => {
          res.status(200).json(album || {});
        }).catch(() => {
          res.status(500).json({
            code: 500,
            message: 'Internal Server error'
          });
        });
      } catch (err) {
        console.error(`[ERROR] album/:id -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  create() {
    this.app.post('/album/', generalLimiter, authenticateToken, async (req, res) => {
      try {
        let album = new this.AlbumModel(req.body);
        album = await album.save();
        album = await album.populate('photos');
        res.status(201).json(album);
      } catch (err) {
        console.error(`[ERROR] album/create -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  updateById() {
    this.app.put('/album/:id', generalLimiter, authenticateToken, async (req, res) => {
      try {
        const albumId = req.params.id;
        const album = await this.AlbumModel.findByIdAndUpdate(albumId, req.body, { new: true });

        if (!album) {
          return res.status(404).json({
            code: 404,
            message: 'Album not found'
          });
        }

        return res.status(200).json(album);
      } catch (err) {
        console.error('[ERROR] update album/:id ->', err);
        return res.status(500).json({
          code: 500,
          message: 'Internal server error',
          error: err.message
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
};

export default Albums;
