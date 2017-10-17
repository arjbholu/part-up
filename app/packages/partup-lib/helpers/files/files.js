import _ from 'lodash';
import _filemap from './_filemap';
import FileInfo from './_fileinfo';

// when testing, Partup may not be initialized.
if (!Partup) {
    Partup = {
        helpers: {
            files: {},
        },
    }
}

/**
 * Partup file helper
 * 
 * @description Provides helpers for the client and server to validate files.
 */
Partup.helpers.files = {

    // #region properties

    /**
     * Acts as an enum for categories where key === value
     * @memberof Partup.helpers.files
     */
    categories: {},

    /**
     * Map of categories to extensions
     * @memberof Partup.helpers.files
     */
    extensions: {},

    /**
     * Map of extensions to FileInfo objects
     * @memberof Partup.helpers.files
     */
    info: {},

    /**
     * Map of signatures to extensions
     * @memberof Partup.helpers.files
     */
    signatures: {},

    /**
     * Maximum file size in bytes (binary, 10mb)
     * @memberof Partup.helpers.files
     */
    max_file_size: 10485760,

    FILE_SERVICES: {
        PARTUP: 'partup',
        DROPBOX: 'dropbox',
        GOOGLEDRIVE: 'googledrive',
    },

    // #endregion

    // #region methods

    /**
     * Get the extension of a file based on the name or mime
     * 
     * @param {File} file
     * @returns {String}
     */
    getExtension(file) {
        if (!file) {
            throw new Meteor.Error(0, 'file is undefined');
        }
        
        const { name, type } = file;

        let ext;
        if (name && name.lastIndexOf('.') !== -1) {
            ext = _.toLower(name.substr((name.lastIndexOf('.') + 1), name.length));
        }

        if (!ext && !type) {
            throw new Meteor.Error(0, 'getExtension:type is undefined');
        }
        const info = ext ?
        this.info[ext] :
        this.info[_.toLower(type)];

        if (!info) {
            throw new Meteor.Error(0, 'invalid name and type');
        } else if (!info instanceof FileInfo) {
            return undefined;
        }
        
        return info.extension;
    },

    getCategory(file) {
        if (!file) {
            throw new Meteor.Error(0, 'extension is undefined');
        }
        const extension = typeof file === 'string' ? file : this.getExtension(file);
        const info = this.info[_.toLower(extension)];
        return info ?
            info.category :
        undefined;
    },

    /**
     * Client side check if the file is an image based on the name or mime.
     * 
     * @param {File} file as long as a name or type property is present
     * @returns {Boolean}
     */
    isImage(file) {
        if (!file) {
            throw new Meteor.Error(0, 'file is undefined');
        }

        if (_.includes(this.extensions.image, this.getExtension(file))) {
            return true;
        }

        let info = this.info[file.type];
        if (info[0]) {
            info = info[0];
        }

        return (info && info.category === this.categories.image) ? true : false;
    },

    /**
     * Get the related SVG icon for a file, does not work for image files.
     * 
     * @param {File} file
     * @returns {String} 'file.svg'
     */
    getSvgIcon(file) {
        if (!file) {
            throw new Meteor.Error(0, 'file is undefined');
        }
        const ext = this.getExtension(file);

        console.log(file);
        return ext ?
            this.info[ext] ?
                this.info[ext].icon ?
                    this.info[ext].icon :
                undefined :
            undefined :
        undefined;
    },

    /**
     * Transform a file category to a Plupload mime filter,
     * pass in extensions to create custom filters.
     * 
     * @param {String} category
     * @param {[String]} extensions optional
     * @returns plupload mime filter
     */
    toUploadFilter(category, extensions = undefined) {
        return {
            title: category,
            extensions: (Array.isArray(extensions) ? extensions.join(',') : extensions) || this.extensions[category].join(','),
        };
    },

    /**
     * Convert a shorthand string size to binary size, e.g. 5mb
     * 
     * @param {String} size e.g. '5mb' 
     * @returns {Number} binary value of size
     */
    shortToBinarySize(size) {
        if (!size === typeof 'string') {
            throw new Meteor.Error(0, `expected size to be of type string but is ${typeof size}`);
        }

        const match = size.match(/([0-9]+)([bkmgt])/i)
        if (match[1]) {
            switch (match[2]) {
                case 'b':
                    return match[1] * 1;
                case 'k':
                    return match[1] * 1024;
                case 'm':
                    return match[1] * 1024 * 1024;
                case 'g':
                    return match[1] * 1024 * 1024 * 1024;
                case 't':
                    return match[1] * 1024 * 1024 * 1024 * 1024;
                default:
                    return;
            }
        }
    }

    // #endregion
};

// Create properties based on _fileMap which is the single source of truth
_.each(_filemap, ({ category, icon, data }) => {
    const typeExts = [];

    _.each(data, fileInfo => {
        const { extension, mime, signatures } = fileInfo;

        typeExts.push(extension);

        const info = new FileInfo(
            category,
            extension,
            mime,
            signatures,
            (fileInfo.icon || icon)
        );

        Partup.helpers.files.info[extension] = info;

        Partup.helpers.files.info[mime] ?
            Partup.helpers.files.info[mime] = _.concat(Partup.helpers.files.info[mime], [info]) :
            Partup.helpers.files.info[mime] = info;

        _.each(signatures, ({ bytes }) => {
            
            if (!Partup.helpers.files.signatures[bytes]) {
                Partup.helpers.files.signatures[bytes] = [];
            }

            Partup.helpers.files.signatures[bytes].push(extension);
        });
    });

    Partup.helpers.files.categories[category] = category;
    Partup.helpers.files.extensions[category] = typeExts;
});

/**
 * Expose an array of all extensions
 */
Partup.helpers.files.extensions.all = _.reduce(Object.keys(Partup.helpers.files.extensions), (result, key) => {
    return _.concat(result, Partup.helpers.files.extensions[key]);
}, []);

/**
 * Expose an array of all categories
 * */
Partup.helpers.files.categories.all = _.reduce(Object.keys(Partup.helpers.files.categories), (result, key) => {
    return _.concat(result, Partup.helpers.files.categories[key]);
});

if (Meteor.isClient) {
    Partup.helpers.files.transform = {
        dropbox(dropboxFile) {
            const file = {
                name: dropboxFile.name,
                type: Partup.helpers.files.info[Partup.helpers.files.getExtension(dropboxFile)].mime,
                bytes: dropboxFile.bytes,
                service: Partup.helpers.files.FILE_SERVICES.DROPBOX,
            };
            console.log(dropboxFile);

            // If we decide to store images without uploading them ourselves
            // if (Partup.helpers.files.isImage(file)) {
            //     file.thumbnailUrl = dropboxFile.thumbnailUrl;
            // }

            // Depending on implementation, just take dropboxFile.link if we decide not to upload them ourselves and save it inside the Files collection.
            file.link = Partup.helpers.files.isImage(file) ?
                `${dropboxFile.link.slice(0, -1)}1` :
            dropboxFile.link;

            return file;
        },
        googledrive(driveFile) {
            const file = {
                name: driveFile.name,
                type: driveFile.mimeType,
                bytes: (!isNaN(driveFile.sizeBytes) ? parseInt(driveFile.sizeBytes) : 0),
                service: Partup.helpers.files.FILE_SERVICES.GOOGLEDRIVE,
            };

            file.link = Partup.helpers.files.isImage(file) ?
                `https://docs.google.com/uc?id=${driveFile.id}` :
            driveFile.url.toString();

            return file;
        },
    };
}

// Freeze the props to prevent any modification, e.g. file.extensions[x] = y
Object.freeze(Partup.helpers.files.categories);
Object.freeze(Partup.helpers.files.extensions);
Object.freeze(Partup.helpers.files.info);
Object.freeze(Partup.helpers.files.signatures);
