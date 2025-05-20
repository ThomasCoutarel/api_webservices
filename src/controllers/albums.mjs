import AlbumModel from '../models/album.mjs';
import PhotoModel from '../models/photto.mjs';

const Albums = class Albums {
  constructor(app, connect, authToken) {
    this.app = app;
    this.AlbumModel = connect.model('Album', AlbumModel);
    this.PhotoModel = connect.model('Photo', PhotoModel);
    this.authToken = authToken;

    this.run();
  }

  deleteById() {
    this.app.delete('/album/:id', this.authToken, async (req, res) => {
      try {
        const album = await this.AlbumModel.findByIdAndDelete(req.params.id);
        if (!album) return res.status(404).json({ message: 'Album non trouvé' });

        await this.PhotoModel.deleteMany({ album: req.params.id });
        return res.status(200).json(album);
      } catch (err) {
        console.error(`[ERROR] DELETE /album/${req.params.id} ->`, err);
        return res.status(500).json({ message: 'Internal Server error' });
      }
    });
  }

  updateById() {
    this.app.put('/album/:id', this.authToken, (req, res) => {
      try {
        this.AlbumModel.findByIdAndUpdate(req.params.id, req.body, { new: true })
          .then((album) => res.status(200).json(album || {}))
          .catch(() => res.status(500).json({ code: 500, message: 'Internal Server error' }));
      } catch (err) {
        console.error(`[ERROR] PUT /album/:id -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  showById() {
    this.app.get('/album/:id', this.authToken, (req, res) => {
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
        console.error(`[ERROR] albums/:id -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  create() {
    this.app.post('/album/', this.authToken, (req, res) => {
      try {
        const albumModel = new this.AlbumModel(req.body);

        albumModel.save().then((album) => {
          res.status(200).json(album || {});
        }).catch(() => {
          res.status(200).json({});
        });
      } catch (err) {
        console.error(`[ERROR] albums/create -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  getAll() {
    this.app.get('/albums', this.authToken, (req, res) => {
      try {
        const { title } = req.query;
        const filter = title ? { title: { $regex: title, $options: 'i' } } : {};
        this.AlbumModel.find(filter).then((albums) => {
          res.status(200).json(albums || []);
        }).catch(() => {
          res.status(500).json({
            code: 500,
            message: 'Internal Server error'
          });
        });
      } catch (err) {
        console.error(`[ERROR] GET /albums -> ${err}`);
        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  run() {
    this.create();
    this.showById();
    this.deleteById();
    this.updateById();
    this.getAll();
  }
};

export default Albums;
