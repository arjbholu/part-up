Template.DropdownNotifications.onCreated(function() {
    var template = this;
    
    template.dropdownOpen = new ReactiveVar(false, function(a, b) {
        if (a === b || b) return;

        Meteor.call('notifications.all_read');
    });

    //Update the number of notifications in the title
    template.autorun(function() {
        var user = Meteor.user();
        if (!user) return;
        var numberOfNotifications = Notifications.findForUser(user, {'new': true}).count();
        Partup.client.windowTitle.setNotificationsCount(numberOfNotifications);
    });
    template.limit = new ReactiveVar(10);
    template.subscribe('notifications.for_upper', template.limit.get());
    template.resetLimit = function() {
        Meteor.setTimeout(function() {
            template.limit.set(10);
            $(template.find('[data-clickoutside-close] ul')).scrollTop(0);
        }, 200);
    };
});
Template.DropdownNotifications.onRendered(function() {
    var template = this;
    ClientDropdowns.addOutsideDropdownClickHandler(template, '[data-clickoutside-close]', '[data-toggle-menu=notifications]', function() {ClientDropdowns.partupNavigationSubmenuActive.set(false);});
    Router.onBeforeAction(function(req, res, next) {
        template.dropdownOpen.set(false);
        next();
    });
    Partup.client.elements.onClickOutside([template.find('[data-clickoutside-close]')], template.resetLimit);
});

Template.DropdownNotifications.onDestroyed(function() {
    var template = this;
    ClientDropdowns.removeOutsideDropdownClickHandler(template);
    Partup.client.elements.offClickOutside(template.resetLimit);
});

Template.DropdownNotifications.events({
    'DOMMouseScroll [data-preventscroll], mousewheel [data-preventscroll]': Partup.client.scroll.preventScrollPropagation,
    'click [data-toggle-menu]': ClientDropdowns.dropdownClickHandler.bind(null, 'top-level'),
    'click [data-notification]': function(event, template) {
        template.dropdownOpen.set(false);
        var notificationId = $(event.currentTarget).data('notification');
        Meteor.call('notifications.clicked', notificationId);
    },
    'click [data-loadmore]': function(event, template) {
        event.preventDefault();
        template.limit.set(template.limit.get() + 10);
        template.subscribe('notifications.for_upper', template.limit.get());
    }
});

Template.DropdownNotifications.helpers({
    menuOpen: function() {
        return Template.instance().dropdownOpen.get();
    },
    notifications: function() {
        var user = Meteor.user();
        var limit = Template.instance().limit.get();
        var parameters = {sort: {created_at: -1}, limit: limit};
        var shownNotifications = Notifications.findForUser(user, {}, parameters);
        var totalNotifications = (Notifications.findForUser(user) || {count: function() {return 0;}}) .count();
        return {
            data: function() {
                return shownNotifications;
            },
            count: function() {
                return totalNotifications;
            },
            canLoadMore: function() {
                return limit <= totalNotifications;
            }
        }
    },
    totalNewNotifications: function() {
        return Notifications.findForUser(Meteor.user(), {'new': true});
    }
});
