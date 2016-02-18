Template.swarm_explorer.onCreated(function() {
    this.rendered = new ReactiveVar(false);
    this.pageLimit = 12;
});
Template.swarm_explorer.onRendered(function() {
    this.rendered.set(true);
});
Template.swarm_explorer.helpers({
    state: function() {
        var template = Template.instance();
        return {
            rendered: function() {
                return template.rendered.get();
            }
        };
    },
    data: function() {
        var data = Template.currentData();
        var template = Template.instance();
        return {
            rings: function() {
                // check if the networks are a mongo cursor
                // if so, we know it's an existing swarm
                var networks = data.networks instanceof Mongo.Collection.Cursor ? data.networks.fetch() : false;
                var innerRingItems = [];
                var outerRingItems = [];

                // determine total number of networks
                var total = networks.length;
                var empty = total ? false : true;
                if (total > template.pageLimit) {
                    var total = Math.ceil(total / 2);
                    var numberOfInnerRingItems = Math.min(4, Math.max(Math.ceil(total / 3), 2));

                    var pages = [{number: 1, inner: [], outer: []},
                                 {number: 2, inner: [], outer: []}];

                    _.each(pages, function(item, index) {
                        _.times(numberOfInnerRingItems, function() {
                            if (networks.length) item.inner.push(networks.pop());
                        });
                        _.times((total - item.inner.length), function() {
                            if (networks.length) item.outer.push(networks.pop());
                        });
                    });
                    return pages;
                    // outerRingItems = networks;
                } else {

                    // number of inner ring items
                    // 1/3 of total, max 4
                    var numberOfInnerRingItems = Math.min(4, Math.max(Math.ceil(total / 3), 2));

                    if (!empty) {
                        _.times(numberOfInnerRingItems, function() {
                            if (networks.length) innerRingItems.push(networks.pop());
                        });
                        outerRingItems = networks;
                    }

                    return networks ? {
                        empty: empty,
                        inner: innerRingItems,
                        outer: outerRingItems
                    } : false;
                }
            },
        };
    },
    static: function() {
        return {
            placeholder: {
                swarmEmpty: {
                    inner: [{
                        type: 'spaceship'
                    },{
                        type: 'astronaut'
                    }],
                    outer: [{
                        type: 'freakin_dog'
                    },{
                        type: 'picture'
                    }]
                },
                swarmNotFound: {
                    inner: [{
                        type: 'spaceship_flying',
                        placeholderPath: 'home'
                    }]
                }
            }
        };
    }
});

Template.swarm_explorer.events({
    'click [data-findout]': function(event, template) {
        event.preventDefault();
        $('html, body').animate({
            scrollTop: window.innerHeight - 90
        }, 500);
    }
});
