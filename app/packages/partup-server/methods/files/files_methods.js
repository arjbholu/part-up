import { Random } from 'meteor/random';

Meteor.methods({
    'files.insert'(file) {
        check(file, Partup.schemas.entities.file);
        this.unblock();

        if (Meteor.user()) {
            if (!file._id) {
                file._id = Random.id();
            }
            Files.insert(file);
            return {
                _id: file._id,
            };
        }
        throw new Meteor.Error(400, 'unauthorized');
    },
    'files.remove'(id) {
        check(id, String);
        this.unblock();

        if (Meteor.user()) {
            Partup.server.services.files.remove(id);
            return {
                _id: id,
            };
        }
        throw new Meteor.Error(400, 'unauthorized');
    },
    'files.remove_many'(ids) {
        check(ids, String);
        this.unblock();

        if (Meteor.user()) {
            _.each(ids, id => Partup.server.services.files.remove(id));
            return {
                _ids: ids,
            };
        }
        throw new Meteor.Error(400, 'unauthorized');
    },
});
