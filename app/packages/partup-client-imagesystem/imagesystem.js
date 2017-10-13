/**
 * Image system widget
 * 
 * This widget is dependant on it's parent to pass the following handlers
 * 
 * @module ImageSystemx
 * @param {ReactiveVar} imageId A reactive source that holds the image Id so the parent template.
 * @param {ReactiveDict} focuspoint [OPTIONAL] A reactive dictionary that holds the x and y of a focuspoint to adjust the center of an image.
 */
//jscs:enable
Template.ImageSystem.onCreated(function() {
    if (!this.data.imageId) {
        throw new Error("The ImageSystem is dependant on 'imageId', this has to be a ReactiveVar passed in from it's parent.");
    }

    // A ReactiveVar that holds the ID of the current image,
    // this get's passed by the parent template to share access.
    this.imageId = this.data.imageId;

    // Tell the view when to show the loading indicator
    this.loading = new ReactiveVar();
    
    // This get's passed to the 'focuspoint' template via a helper to give it control over the focuspoint
    this.setFocuspoint = (x = 0.5, y = 0.5) => {
        this.focuspoint.set('x', x);
        this.focuspoint.set('y', y);
    }

    // Focuspoint handler
    this.focuspoint = this.data.focuspoint || new ReactiveDict();
    this.setFocuspoint();

    this.draggingFocuspoint = new ReactiveVar(false);

    // Placeholder for image subscription.
    this.imageSubHandler = undefined;

    // Hack because template get's created twice in some cases, see bottom of onRendered.
    this.initTimeout = 0;
});

Template.ImageSystem.onRendered(function() {
    const template = this;
    const browseButton = template.find('[data-browse]');

    template.uploader = new Pluploader({
        config: {
            browse_button: browseButton,
            container: template.find('[data-upload-container]'),
            drop_element: template.find('[data-drop-area]'),
            multi_selection: false,
        },
        types: [
            Partup.helpers.files.categories.image,
        ],
        hooks: {
            FilesAdded(uploader, files) {
                _.each(files, file => {
                    if (!Partup.helpers.files.isImage(file)) {
                        uploader.removeFile(file);
                        Partup.client.notify.info(TAPi18n.__('upload-error-not_image', { filename: file.name }));
                    }
                });

                if (uploader.files.length > 0) {
                    template.loading.set(true);
                    uploader.start();
                }
            },
            FileUploaded(uploader, file, result) {
                if (!result) return;
                const response = JSON.parse(result.response);

                if (response.error) {
                    template.loading.set(false);
                    Partup.client.notify.error(TAPi18n.__(response.error.reason), { filename: file.name });
                    return;
                }

                // This might not be nessecary, have to look at the server side code.
                if (!response.fileId) {
                    template.loading.set(false);
                    Partup.client.notify.info(TAPi18n.__('upload-error-100'), { filename: file.name });
                    return;
                }

                // Stop the old subscription once the new image is uploaded.
                if (template.imageSubHandler) {
                    template.imageSubHandler.stop();
                }
                // The subscription is required to be able to access the Images collection from the helpers
                template.imageSubHandler = template.subscribe('images.one', response.fileId, {
                    onReady() {
                        template.loading.set(false);
                        template.imageId.set(response.fileId);
                        template.setFocuspoint();
                    },
                });
            },
        },
    });

    // In some cases the template get's created twice, 
    // to prevent errors while plupload is initializing a timeout is nessecary
    this.initTimeout = setTimeout(function() {
        template.uploader.init();
    }, 1500);

    // Add event listeners to add visual when a file is dragged over the drop area.
    (function () {
        const $dropEl = $(template.find('[data-drop-area]'));
        const activeClass = 'pu-drop-active';

        let ignoreLeave = false;

        $dropEl.on('dragenter', function(event) {
            if (event.target !== this) {
                ignoreLeave = true;
            }
            $(this).addClass(activeClass);
        }).on('dragleave', function(event) {
            if (ignoreLeave) {
                ignoreLeave = false;
                return;
            }
            $(this).removeClass(activeClass);
        }).on('dragend', function(event) {
            $dropEl.removeClass(activeClass);
        }).on('drop', function(event) {
            $dropEl.removeClass(activeClass);
        });

        _.each($dropEl.children, child => {
            $(child).on('dragleave', function(event) {
                event.stopPropagation();
            });
        });
    }());
});

Template.ImageSystem.onDestroyed(function() {
    clearTimeout(this.initTimeout);
    if (this.imageSubHandler) {
        this.imageSubHandler.stop();
    }
    this.uploader.destroy();
});

Template.ImageSystem.helpers({
    imageId() {
        return Template.instance().imageId.get();
    },
    imageUrl() {
        const imageId = Template.instance().imageId.get();
        if (!imageId) {
            return;
        }
        const image = Images.findOne({ _id: imageId });
        return Partup.helpers.url.getImageUrl(image, '1200x520');
    },
    loading() {
        return Template.instance().loading.get();
    },
    draggingFocuspoint() {
        return Template.instance().draggingFocuspoint.get();
    },
    focuspointView() {
        return {
            template: Template.instance(),
            selector: '[data-focuspoint-view]',
        }
    },
    setFocuspoint() {
        const template = Template.instance();
        return function(focuspoint) {
            focuspoint.on('drag:start', () => {
                template.draggingFocuspoint.set(true);
            });
            focuspoint.on('drag:end', (x, y) => {
                template.draggingFocuspoint.set(false);
                template.setFocuspoint(x, y);
            });
        }
    },
    unsetFocuspoint() {
        const template = Template.instance();
        return function() {
            // do nothing....
            // The focuspoint requires an unset handler, we don't need this funtionallity though.
        }
    },
});
