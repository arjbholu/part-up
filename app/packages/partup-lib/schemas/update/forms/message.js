Partup.schemas.forms.message = new SimpleSchema({
    text: {
        type: String,
        max: 1000,
    },
    images: {
        type: [String],
        optional: true,
    },
    documents: {
        type: [String],
        optional: true,
    },
});
