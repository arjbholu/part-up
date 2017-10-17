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

        // const { service } = file;
        // if (service === Partup.helpers.files.FILE_SERVICES.DROPBOX) {
        //     // Do dropbox way...
        // }

        const request = HTTP.get(file.link, { npmRequestOptions: { encoding: null } });
        const fileBody = new Buffer(request.content, 'binary');
        const image = Partup.server.services.images.upload(file.name, fileBody, file.type, {
            id: file._id,
        });

        // if (image._id !== file._id) {
        //     console.error("images.insertByUrl: is mismatch, input and result id's don't match");
        //     return {};
        // }
        return {
            _id: image._id,
        };
    },
    'images.remove'(id) {
        check(id, String);

        Partup.server.services.images.remove(id);
        Images.remove(id);
        return {
            _id: id,
        };
    },
    'images.remove_many'(ids) {
        check(ids, [String]);

        if (Meteor.user()) {
            _.each(ids, (id) => {
                Partup.server.images.remove(id);
                Images.remove(id);
            });
            return {
                _ids: ids,
            };
        }
        throw new Meteor.Error(400, 'unauthorized');
    },

});
