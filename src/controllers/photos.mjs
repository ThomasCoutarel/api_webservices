import PhotoModel from '../models/photto.mjs';
import AlbumModel from '../models/album.mjs';

const Photos = class Photos {
  constructor(app, connect) {
    this.app = app;
    this.PhotoModel = connect.model('Photo', PhotoModel);
    this.AlbumModel = connect.model('Album', AlbumModel);
    this.run();
  }

  getAllPhotos() {
    this.app.get('/album/:idalbum/photos', (req, res) => {
      try {
        this.PhotoModel.find({ album: req.params.idalbum })
          .populate('album')
          .then((photos) => res.status(200).json(photos || []))
          .catch(() => res.status(500).json({ code: 500, message: 'Internal Server error' }));
      } catch (err) {
        console.error(`[ERROR] GET /album/${req.params.idalbum}/photos -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  getPhotoById() {
    this.app.get('/album/:idalbum/photo/:idphotos', (req, res) => {
      try {
        this.PhotoModel.findOne({ _id: req.params.idphotos, album: req.params.idalbum })
          .populate('album')
          .then((photo) => res.status(200).json(photo || {}))
          .catch(() => res.status(500).json({ code: 500, message: 'Internal Server error' }));
      } catch (err) {
        console.error(
          `[ERROR] GET /album/${req.params.idalbum}/photo/${req.params.idphotos} -> ${err}`
        );
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  createPhoto() {
    this.app.post('/album/:idalbum/photo', (req, res) => {
      try {
        const newPhoto = new this.PhotoModel({ ...req.body, album: req.params.idalbum });
        newPhoto.save()
          .then((savedPhoto) => {
            this.AlbumModel.findByIdAndUpdate(req.params.idalbum, {
              $push: { photos: savedPhoto._id }
            })
              .then(() => res.status(201).json(savedPhoto))
              .catch(() => res.status(500).json({ code: 500, message: 'Internal Server error' }));
          })
          .catch(() => res.status(500).json({ code: 500, message: 'Internal Server error' }));
      } catch (err) {
        console.error(`[ERROR] POST /album/${req.params.idalbum}/photo -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  updatePhoto() {
    this.app.put('/album/:idalbum/photo/:idphotos', (req, res) => {
      try {
        this.PhotoModel.findOneAndUpdate(
          { _id: req.params.idphotos, album: req.params.idalbum },
          req.body,
          { new: true }
        )
          .then((updatedPhoto) => res.status(200).json(updatedPhoto || {}))
          .catch(() => res.status(500).json({ code: 500, message: 'Internal Server error' }));
      } catch (err) {
        console.error(
          `[ERROR] PUT /album/${req.params.idalbum}/photo/${req.params.idphotos} -> ${err}`
        );
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  // controllers/photos.mjs
  deletePhoto() {
    this.app.delete('/album/:idalbum/photo/:idphotos', async (req, res) => {
      try {
        const { idalbum, idphotos } = req.params;
        const session = await this.PhotoModel.startSession();
        session.startTransaction();

        const deletedPhoto = await this.PhotoModel.findOneAndDelete(
          { _id: idphotos, album: idalbum },
          { session }
        );

        if (!deletedPhoto) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ message: 'Photo non trouvée' });
        }

        await this.AlbumModel.findByIdAndUpdate(
          idalbum,
          { $pull: { photos: deletedPhoto._id } },
          { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(deletedPhoto);
      } catch (err) {
        console.error(`[ERROR] DELETE /album/${req.params.idalbum}/photo/${req.params.idphotos} -> ${err}`);
        return res.status(500).json({ code: 500, message: 'Internal Server error' });
      }
    });
  }

  run() {
    this.getAllPhotos();
    this.getPhotoById();
    this.createPhoto();
    this.updatePhoto();
    this.deletePhoto();
  }
};

export default Photos;
