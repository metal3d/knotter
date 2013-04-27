YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "Handler",
        "Server"
    ],
    "modules": [
        "knotter"
    ],
    "allModules": [
        {
            "displayName": "knotter",
            "name": "knotter",
            "description": "Knotter module. This is a simple module that use a pseudo WSGI\narchitechture. You only have to set some knotter.Handler given route and methods\n(get: function (){...}) then append them to knotter.Server.\n\nAfter calling \"start\" method, each of your handlers will respond to url that match\nroute.\n\nExample:\n\n    var knotter = require('knotter');\n\n    var h = new knotter.Handler({\n         route: '/my/page',\n\n         get: function (){\n             this.response.end(\"This is my page\");\n         }\n    });\n\n    var s = new knotter.Server({\n         handlers: [h], //list of handlers\n    });\n\n    s.start()"
        }
    ]
} };
});