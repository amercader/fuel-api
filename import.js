var fs = require('fs');
var path = require('path');
var csv = require('csv');
var mongodb = require('mongodb');


var file = process.argv[2];

if (!file) {
  console.log('No file defined');
  process.exit(1);
}

if (!fs.existsSync(file)) {
  console.log('File does not exist');
  process.exit(1);
}


var mongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/fuel';


fs.readFile(file, 'utf8', function(err, data) {
  metadata = JSON.parse(data);

  var csvFile = path.join(
      path.dirname(file),
      metadata.resources[0].path
      );

  importData(csvFile, metadata);
});


function importData(csvFile, metadata) {


  console.time('import');
  mongoClient.connect(url, function(err, db) {
    if(err) throw err;

    console.log('Connected to mongo');

    var collection = db.collection('cars');
    var headers;
    var cnt = 1;

    console.log('Reading file ' + csvFile);

    csv()
      .from
      .stream(fs.createReadStream(csvFile),
        {'columns': true})
      .transform(function(data){
        if (!headers) {
            headers = Object.keys(data);
            console.log('Using headers:' + headers);
        }

        function getFieldType(fieldName){
          var field;
          for (var i in metadata.resources[0].schema.fields) {
            field = metadata.resources[0].schema.fields[i];
            if (field.id == fieldName){
              return field.type;
            }
          };
          return null;
        }

        var fieldType;
        for(var i=0; i < headers.length; i++){
          key = headers[i];
          data[key] =  (data[key] != '') ? data[key] : null;
          fieldType = getFieldType(key);
          if (data[key] && fieldType == 'number') {
            data[key] = parseFloat(data[key]);
          } else if (data[key] && fieldType == 'integer') {
            data[key] = parseInt(data[key]);
          }
        }

        return data;

      })
      .on('record', function(row, index){
        collection.insert(row, {safe: true}, function(err, records){
          if (err) throw err;

          console.log('Inserted record #' + cnt);
          cnt++;

        });
      })
      .on('end', function(count){
        console.log('Done parsing the file. Number of lines: ' + count);
        console.timeEnd('import');
        process.exit(0);

      })
      .on('error', function(err){
        console.log(err.message);
      });
  });

}
