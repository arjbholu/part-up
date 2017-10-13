
const FileBaseSchema = new SimpleSchema({
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
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
    },
    meta: {
        type: Object, // I have no clue as we don't use this atm..
        optional: true,
    },
}]);

const FileAttachedSchema = new SimpleSchema([FileBaseSchema, {
    link: {
        type: String,
        optional: true,
    },
    isPartupFile: {
        type: Boolean,
        optional: true,
    },
}]);

Partup.schemas.entities.file = FileSchema;
Partup.schemas.forms.fileAttached = FileAttachedSchema;
