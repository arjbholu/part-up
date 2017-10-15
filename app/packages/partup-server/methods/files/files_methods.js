Meteor.methods({
    'files.insert'(file) {
        check(file, Partup.schemas.entities.file);
        this.unblock();

        if (Meteor.user()) {
            Files.insert(file);
            return {
                _id: file._id,
            };
        }
        throw new Meteor.Error(400, 'unauthorized');
    },
    'files.remove'(fileIds) {
        fileIds = (fileIds instanceof Array) ?
            fileIds : 
        [fileIds];
        check(fileIds, [String]);

        try {
            _.each(fileIds, id => Partup.server.services.files.remove(id));
        } catch (error) { winston.log(error); }
        return {
            result: true,
        };
    },
});
