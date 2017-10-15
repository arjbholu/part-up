var path = Npm.require('path');

Meteor.methods({

    /**
     * Insert an image by url
     *
     * @param {String} url
     *
     * @return {String} imageId
     */
    'images.insertByUrl'(file) {
        check(file, Partup.schemas.entities.file);
        this.unblock();

        const request = HTTP.get(file.link, { npmRequestOptions: { encoding: null } });
        const fileBody = new Buffer(request.content, 'binary');
        const image = Partup.server.services.images.upload(file.name, fileBody, file.type, {
            id: file._id,
        });
        return {
            _id: image._id,
        };
    },
    'images.remove'(imageIds) {
        imageIds = (imageIds instanceof Array) ?
            imageIds :
        [imageIds];
        check(imageIds, String);

        _.each(imageIds, id => Partup.server.services.images.remove(id));
        return {
            result: true,
        };
    },

});
