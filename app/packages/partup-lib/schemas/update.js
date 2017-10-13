/**
 * Base Update schema
 * @name updateBaseSchema
 * @memberof Partup.schemas
 * @private
 */
var updateBaseSchema = new SimpleSchema({
    type: {
        type: String
    },
    type_data: {
        type: Object
    },
    'type_data.new_value': {
        type: String
    },
    'type_data.old_value': {
        type: String
    },
    'type_data.upper': {
        type: Object
    },
    'type_data.upper._id': {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    'type_data.upper.image': {
        type: Object,
        optional: true
    },
    'type_data.upper.name': {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    }
});

/**
 * Base Comment Update schema
 * @name updateCommentBaseSchema
 * @memberof Partup.schemas
 * @private
 */
var updateCommentBaseSchema = new SimpleSchema({
    content: {
        type: String,
        custom: function() {
            var commentLength = Partup.helpers.mentions.getTrueCharacterCount(this.value);
            if (commentLength > 1000) return 'exceedsMaxCharacterLength';
        }
    },
    type: {
        type: String,
        optional: true,
        allowedValues: ['motivation', 'system']
    }
});

/**
 * Update Comment entity schema
 * @name updateComment
 * @memberof Partup.schemas.entities
 */
Partup.schemas.entities.updateComment = new SimpleSchema([updateCommentBaseSchema, {
    _id: {
        type: String
    },
    creator: {
        type: Object
    },
    'creator._id': {
        type: String
    },
    'creator.name': {
        type: String
    },
    'creator.image': {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    created_at: {
        type: Date,
        defaultValue: new Date()
    },
    updated_at: {
        type: Date,
        defaultValue: new Date()
    }
}]);

/**
 * Update entity schema
 * @name update
 * @memberof Partup.schemas.entities
 */
Partup.schemas.entities.update = new SimpleSchema([updateBaseSchema, {
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    comments: {
        type: [Partup.schemas.entities.updateComment],
        optional: true
    },
    comments_count: {
        type: Number,
        defaultValue: 0
    },
    has_documents: {
        type: Boolean,
        defaultValue: false
    },
    has_links: {
        type: Boolean,
        defaultValue: false
    },
    partup_id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    created_at: {
        type: Date,
        defaultValue: new Date()
    },
    updated_at: {
        type: Date,
        defaultValue: new Date()
    },
    upper_data: {
        type: [Object],
        optional: true
    },
    'upper_data.$._id': {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    'upper_data.$.new_comments': {
        type: [String],
        optional: true
    }
}]);

/**
 * Insert Update Comment form schema
 * @name updateComment
 * @memberof Partup.schemas.forms
 */
Partup.schemas.forms.updateComment = new SimpleSchema([updateCommentBaseSchema]);

/**
 * Based on dropboxFile object response, but this is also the preferred
 * object file for every other services e.g. GoogleDrive
 * https://www.dropbox.com/developers/chooser
 * @type {SimpleSchema}
 */
var DocumentSchema = new SimpleSchema({
    _id: {
        type: String
    },
    id: {
        type: String,
        optional: true
    },
    type: {
        type: String,
        optional: true
    },
    mimeType: {
        type: String,
        optional: true
    },
    name: {
        type: String,
        optional: true
    },
    link: {
        type: String,
        optional: true
    },
    bytes: {
        type: Number,
        optional: true
    },
    icon: {
        type: String,
        optional: true
    },
    thumbnailLink: {
        type: String,
        optional: true
    },
    is_dir: {
        type: Boolean,
        optional: true
    },
    isDir: {
        type: Boolean,
        optional: true
    },
    isPartupFile: {
        type: Boolean,
        optional: true
    }
});


/**
 * New message Form
 * @name newMessage
 * @memberof Partup.schemas.forms
 */
Partup.schemas.forms.newMessage = new SimpleSchema({
    text: {
        type: String,
        max: 10000
    },
    images: {
        type: [String],
        optional: true
    },
    documents: {
        type: [DocumentSchema],
        optional: true
    },
    files: {
        type: [String],
        optional: true
    }
});
