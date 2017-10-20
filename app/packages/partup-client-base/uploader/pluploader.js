import _ from 'lodash';
import './plupload/plupload.min';

/**
 * The partup file uploader.
 * 
 * @class _Pluploader
 */
class _Pluploader {
    constructor(options) {
        
        const config = _.extend({
            url: `${Partup.client.window.location}/files/upload?token=${Accounts._storedLoginToken()}`,
            flash_swf_url: './plupload/runtimes/Moxie.swf',
            silverlight_xap_url: './plupload/runtimes/Moxie.xap',
            filters: {
                max_file_size: Partup.helpers.files.max_file_size,
                prevent_duplicates: true,
            },
            init: {
                Error(uploader, error) {
                    // For a list of all plupload errors/codes see http://www.plupload.com/punbb/viewtopic.php?id=917
                    switch (error.code) {
                        case -500:
                            Partup.client.notify.error(TAPi18n.__(`upload-error${error.code}`));
                            break;
                        default:
                            Partup.client.notify.error(TAPi18n.__(`upload-error${error.code}`, { filename: error.file.name }));
                            break;
                    }
                }
            },
        }, options.config);

        // extend the new pluploader with this class,
        // doing it the other way around will cause every __proto__ prop to be set on the class instead of proto.
        const uploader = _.merge(new plupload.Uploader(config), this);

        uploader.setMimeFilters(options.types);
        _registerHooks(uploader, options.hooks);

        return uploader;
    }

    setMimeFilters(categories) {
        const filters = this.getOption('filters');
        if (!categories) {
            filters.mime_types = [Partup.helpers.files.toUploadFilter('all', Partup.helpers.files.extensions.all)];
        } else {
            filters.mime_types = _.map(categories, category => (Partup.helpers.files.toUploadFilter(category)));
        }
        this.setOption('filters', filters);
    }
    addMimeFilter(category) {
        if (!category) {
            return;
        }
        const filters = this.getOption('filters');
        filters.mime_types.push({ title: category, extensions: Partup.helpers.files.extensions[category] });
        this.setOption('filters', filters);
    }
    removeMimeFilter(name) {
        if (!name) {
            return;
        }
        const filters = this.getOption('filters');
        _.remove(filters.mime_types, {
            title: name,
        });
        this.setOption('filters', filters);
    }
    setMaxFileSize(size) {
        const binarySize = Partup.helpers.files.shortToBinarySize(size);
        if (!binarySize) {
            throw new Meteor.Error(0, 'could not set max file size');
        }

        const filters = this.getOption('filters');
        filters.max_file_size = binarySize;
        this.setOption('filters', filters);
    }
}

// Register any hook that matches the plupload API
const _registerHooks = (uploader, hooks) => {
    if (hooks) {
        _.each(Object.keys(hooks), key => uploader.bind(key, hooks[key]));
    }
};

Pluploader = _Pluploader;
