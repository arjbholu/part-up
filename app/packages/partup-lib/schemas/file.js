
const FileBaseSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
    },
    guid: {
        type: String,
        optional: true,
    },
    name: {
        type: String,
    },
    type: {
        type: String,
    },
});

const FileSchema = new SimpleSchema([FileBaseSchema, {
    createdAt: {
        type: Date,
        optional: true,
    },
    bytes: {
        type: Number,
    },
    service: {
        type: String,
    },
    link: {
        type: String,
    },
}]);

const FileFormSchema = new SimpleSchema([FileBaseSchema, {
    
}]);

Partup.schemas.entities.file = FileSchema;
Partup.schemas.forms.fileAttached = FileFormSchema;
