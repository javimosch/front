var mongoose = require('mongoose');
var express = require('express');
var dbUri = process.env.DBURI || 'mongodb://localhost/mydb';
var mongo_express_config = require('./mongo_express_config')
var mongo_express = require('mongo-express/lib/middleware')
var reload = require('require-reload')(require);
var requireFromString = require('require-from-string');
module.exports = {
    run: () => {

        mongoose.connect(dbUri, { useMongoClient: true, promiseLibrary: global.Promise });

        saveTestModule();

        var app = express();



        let scope = {};

        app.use('/mongo_express', mongo_express(mongo_express_config))

        app.get('/', function(req, res) {
            res.send('Hello World! ' + scope.foo.hi());
        });

        app.listen(8080, function() {
            console.log('Example app listening on port 8080!');
        });



        async function saveTestModule() {
            console.log('saveTestModule');
            var Module = mongoose.model('Module', {
                name: {
                    type: String,
                    unique: true,
                    index: true
                },
                dependencies: [String], //Exposed properties
                tags: [String],
                contents: String
            });

            let doc = await Module.findOne({}).exec();
            console.log('saveTestModule:doc', doc);
            if (!doc) {
                console.log('saveTestModule:savin');

                await (Module({
                    name: "zet",
                    dependencies: [],
                    tags: ['test'],
                    contents: `
                        let self = module.exports=function(){
                        console.log('ZET SCOPE IS',Object.keys(this);
                        this.zet.hi();
                    };
                    self.hi = function(){
                        console.log('HOHOHO ZET HERE!!',this.foo.hi());
                    }
                    `
                })).save();

                await (Module({
                    name: "bar",
                    dependencies: [],
                    tags: ['test'],
                    contents: `
                        var moment = require('moment');
                        let self = module.exports=function(){
                        
                        console.log('bar init, no depedencies');
                        
                    };
                    
                    self.hi = ()=>"Hi, this is Bar";
                    
                    `
                })).save();
                var kitty = new Module({
                    name: "foo",
                    dependencies: ['bar'],
                    tags: ['test'],
                    contents: `let self = module.exports=function(){
                        console.log('foo init, I require bar!!');
                        console.log(this.bar.hi());
                        
                        self.hiHandler = ()=>"I'm foo, the brother of bar, say hi bar.. Bar: "+this.bar.hi();
                    };
                    
                    self.hi = ()=>self.hiHandler();
                    
                    
                    
                    `
                });
                kitty.save(function(err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log('meow');
                    }
                });
            }

            //MODULE INYECTION
            setInterval(async() => {
                let docs = await Module.find({}).exec();
                docs = reorderModulesByDepedency(docs);
                docs.forEach(obj => {
                    let doc = obj.module;
                    console.log('Looping module', doc.name);
                    if (!obj.success) {
                        return console.log('Module ', doc.name, 'require dependency', obj.dependency);
                    }
                    try {
                        //console.log('Require from string', doc.name);
                        let handler = requireFromString(doc.contents);
                        scope[doc.name] = {};
                        for (var x in handler) {
                            if (x.charAt(0) == '$') continue;
                            scope[doc.name][x] = function() {
                                handler[x].apply(scope, arguments);
                            };
                            //console.log('Scope add ', doc.name + '.' + x);
                        }
                        //console.log('Scope module', doc.name, 'props are ', Object.keys(scope[doc.name]));
                        handler.apply(scope, []);
                    }
                    catch (err) {
                        if (err.code !== 'MODULE_NOT_FOUND') {
                            console.log(err.code, err.message, err.stack);
                            return;
                        }
                        //MODULE_NOT_FOUND Cannot find module 'jquery' {
                        let m = err.message;
                        var depName = m.substring(m.indexOf("'") + 1, m.length - 1);
                        let shell = require('shelljs');
                        console.log('Adding ', depName);
                        shell.exec('yarn add ' + depName);
                        shell.exec('git add package.json');
                        console.log('Commiting..');
                        shell.exec('git commit -m "#1 Missing module ' + depName + '"');
                        console.log('Pushing...');
                        shell.exec('git push origin');
                        //console.log('ERR', err.code, err.message, err);
                        console.log('Done! (Depedency ' + depName + ' added)');
                    }
                });

                console.log('SCOPE REPORT', JSON.stringify(scope));
            }, 5000);
        };

    }
};

function reorderModulesByDepedency(docs) {
    var arr = [];
    var maxDepsQ = 0;
    docs.forEach(d => {
        if (d.dependencies.length > maxDepsQ) maxDepsQ = d.dependencies.length;
    });
    var docsInHand = [];
    for (var q = 0; q <= maxDepsQ; q++) {
        docsInHand = docs.filter(d => d.dependencies.length == q);
        //console.log('Reorder ', docsInHand.map(d => d.name + '(' + d.dependencies.join(',') + ')'))
        if (q == 0) {
            docsInHand.forEach(d => arr.push({
                module: d,
                success: true
            }));
        }
        else {
            docsInHand.forEach(d => {
                //console.log(d.name, 'My deps are', d.dependencies);
                for (var dx = 0; dx < d.dependencies.length; dx++) {
                    if (typeof d.dependencies[dx] !== 'string') continue;
                    var dependency = d.dependencies[dx];
                    //console.log(d.name, 'dep', dependency, 'check');
                    if (arr.filter(obj => obj.module.name == dependency).length == 0) {
                        arr.push({
                            module: d,
                            success: false,
                            dependency: dependency
                        });
                        return;
                    }
                }
                arr.push({
                    module: d,
                    success: true
                });
            });
        }
    }
    return arr;
}
