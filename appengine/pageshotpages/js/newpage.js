var IS_NEWPAGE = true;

function injectData(docData) {
  if (! document.body) {
    // FIXME: I'm not sure when if ever this might happen, but it seems to happen,
    // hence the strong alert:
    alert("document.body not ready");
    window.addEventListener("load", function () {
      injectData(docData);
    }, false);
    return;
  }
  docData = JSON.parse(docData);
  var head = '<base href="' + docData.location + '" target="_top">\n';
  head += '<!--METADATA--><!--ENDMETA-->';
  head += docData.head;
  head += '<meta property="og:image" content="' + docData.screenshot + '">\n';
  document.head.innerHTML += head;
  document.body.innerHTML = docData.body + '<div id="pageshot-meta"></div>';
  setAttributes(document.documentElement, docData.htmlAttrs);
  setAttributes(document.body, docData.bodyAttrs);
  if (docData.initialScroll) {
    var pos = Math.floor(document.body.clientHeight * docData.initialScroll);
    console.log("scroll to", pos, docData.initialScroll, document.body.clientHeight);
    window.scroll(0, pos);
  }
  history.pushState({}, "static page", location.origin + "/content/" + docData.id + "/" + docData.domain);
  interfaceReady();
  var req = new XMLHttpRequest();
  req.open("PUT", location.origin + "/data/" + docData.id + "/" + docData.domain);
  req.onload = function () {
    console.log("Saved");
  };
  req.send(JSON.stringify(docData));
}

function setAttributes(el, attrs) {
  for (var i=0; i<attrs.length; i++) {
    el.setAttribute(attrs[i][0], attrs[i][1]);
  }
}
