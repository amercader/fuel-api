var util = require('util');
var solr = require('solr-client');

var versions = ['1'];

exports.checkVersion = function(req, res, next) {
  if (versions.indexOf(req.params.version) == -1) {
    res.send('404', {error: {type: 'api', msg: 'Supported API versions are:' + versions}});
  }

  next();
}


exports.search= function(req, res) {

  var solrClient = solr.createClient('localhost', '8080', 'fuel');
  var query = solrClient.createQuery()
  var debug = Boolean(req.query['debug']);
  var parts;

  var params = ['q', 'start', 'rows'];
  console.log(req.query);
  for (var i in params) {
    if (req.query[params[i]]) {
      query[params[i]](req.query[params[i]]);
    }
  }

  if (req.query['sort']) {
    var fields = req.query['sort'].split(',');
    var sort = {};
    for (var i = 0; i < fields.length; i++) {
      parts = fields[i].trim().split(' ');
      sort[parts[0]] = (parts.length > 1) ? parts[1] : 'asc';
    }
    query.sort(sort);
  }

  if (req.query['fq']) {
    var fq = req.query['fq'];
    var removeBrackets = /\[|\]/g;
    var range;
    if (!util.isArray(req.query['fq'])) {
      fq = [fq];
    }
    for (var i = 0; i < fq.length; i++) {
      parts = fq[i].trim().split(':');
      if (parts[1].indexOf('[') !== -1) {
        range = parts[1].trim().replace(removeBrackets,'').split(' TO ');
        if (range.length !== 2) {
          res.send('400', {error: {type: 'api', msg: 'Wrong fq parameter:' + fq[i]}});
        }
        query.rangeFilter({ 'field': parts[0].trim(), 'start': range[0], 'end': range[1]});
      } else {
        query.matchFilter(parts[0].trim(), parts[1].trim());
      }
    }
  }

  var facetOptions = {}
  for (var key in req.query) {
    if (key.substring(0,5) == 'facet') {
      if (key.indexOf('.') !== -1) {
        if (key == 'facet.field') {
          facetOptions['field'] = req.query[key] + '_s';
        } else {
          facetOptions[key.split('.')[1]] = req.query[key];
        }
      } else {
        facetOptions['on'] = req.query[key] == 'true';
      }
    }
  }
  if (Object.keys(facetOptions).length) {
    query.facet(facetOptions);
  }

  solrClient.search(query, function(err, obj){
    if (err) {
      var solrError = err.message.match(/{(.*)}/g);
      if (solrError) {
        solrError = JSON.parse(solrError);
        res.send(solrError.error.code, {error: {type: 'solr', 'msg': solrError.error.msg}});
      } else {
        res.send(500, {error: {type: 'solr', 'msg': 'Unknown Solr error'}});
      }

    } else {

      var resObj = {
        count: obj.response.numFound,
        facets: {},
        results: []
      };


      if (obj.facet_counts) {
        for (var key in obj.facet_counts.facet_fields) {
          resObj.facets[key.replace(/_s$/,'')] = obj.facet_counts.facet_fields[key];
        }
      }

      for (var i = 0; i < obj.response.docs.length; i++) {
        delete obj.response.docs[i]['_version_'];
        resObj.results.push(obj.response.docs[i]);
      }

      if (debug) {
        resObj['__debug'] = {
          'queryParams': req.query,
          'solrResponse': obj['responseHeader']
        };
      }

      res.send(resObj);
    }
  });
}

