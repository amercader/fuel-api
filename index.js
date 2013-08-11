var util = require('util');
var mongodb = require('mongodb');
var solr = require('solr-client');

var command = process.argv[2] || 'import';

// Create clients
var mongoClient = mongodb.MongoClient;
var solrClient = solr.createClient('localhost', '8080', 'fuel');


if (command == 'import') {
   _import()
} else if (command == 'rebuild') {
    clear(_import);
} else if (command == 'clear') {
    clear();
} else {
  console.log('Unknown command');
  process.exit(1);
}


function clear(callback) {
  solrClient.delete('*', '*', function(err, obj){
    if (err) {
      console.log(err);
    } else {
      console.log('Index cleared');
      if (callback) {
        callback();
      } else {
        commitSolr();
      }
    }

  });
}


function _import() {


  console.time('index');
  var url = 'mongodb://localhost:27017/fuel';

  mongoClient.connect(url, function(err, db) {
    if(err) throw err;
    console.log('Connected to Database');
    var collection = db.collection('cars');

    collection.count(function(err, count) {
      console.log('There are ' + count + ' records.');
    });

    collection.find().toArray(function(err, docs) {
      index(docs)
    });

  });

  var waiting = 0;
  function index(documents) {
    for (var i = 0; i < documents.length; i++){
      waiting++;
      doc = documents[i];
      if(doc != null) {
        for (var key in doc) {
          if (typeof(doc[key]) === 'string') {
            doc[key + '_s'] = doc[key];
          }
        }
        //doc.object = JSON.stringify(doc);
        var id = doc._id;
        solrClient.add(doc, function(err, obj){
          waiting--;
          if(err) {
            console.log(err);
          } else if (!waiting){
            console.timeEnd('index');
            commitSolr();
          }

        });
      }
    }
  }

}

function commitSolr() {
  solrClient.commit(function(err,res){
    if(err) console.log(err);

    console.log('Commited changes to Solr');
    process.exit(0);

  });
}
