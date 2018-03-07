/* globals catcher, log */

"use strict";

this.communication = (function() {
  const exports = {};

  const registeredFunctions = {};

  exports.onMessage = catcher.watchFunction((req, sender, sendResponse) => {
    if (!(req.funcName in registeredFunctions)) {
      log.error(`Received unknown internal message type ${req.funcName}`);
      sendResponse({type: "error", name: "Unknown message type"});
      return;
    }
    if (!Array.isArray(req.args)) {
      log.error("Received message with no .args list");
      sendResponse({type: "error", name: "No .args"});
      return;
    }
    const func = registeredFunctions[req.funcName];
    let result;
    try {
      req.args.unshift(sender);
      result = func.apply(null, req.args);
    } catch (e) {
      log.error(`Error in ${req.funcName}:`, e, e.stack);
      // FIXME: should consider using makeError from catcher here:
      sendResponse({type: "error", message: e + "", errorCode: e.errorCode, popupMessage: e.popupMessage});
      return;
    }
    if (result && result.then) {
      result.then((concreteResult) => {
        sendResponse({type: "success", value: concreteResult});
      }).catch((errorResult) => {
        log.error(`Promise error in ${req.funcName}:`, errorResult, errorResult && errorResult.stack);
        sendResponse({type: "error", message: errorResult + "", errorCode: errorResult.errorCode, popupMessage: errorResult.popupMessage});
      });
      return;
    }
    sendResponse({type: "success", value: result});
  });

  exports.register = function(name, func) {
    registeredFunctions[name] = func;
  };

  /** Send a message to bootstrap.js
      Technically any worker can listen to this.  If the bootstrap wrapper
      is not in place, then this will *not* fail, and will return a value
      of exports.NO_BOOTSTRAP. On Chrome, the bootstrap wrapper is not
      supported, so hard-coded responses will be returned from the
      sendMessageStub function in this file. */
  exports.sendToBootstrap = function(funcName, ...args) {
    // TODO: use buildSettings for this
    let isChrome = true;
    let fn = isChrome ? sendMessageStub : browser.runtime.sendMessage;
    return fn({funcName, args}).then((result) => {
      if (result.type === "success") {
        return result.value;
      }
      throw new Error(`Error in ${funcName}: ${result.name || "unknown"}`);
    }, (error) => {
      if (isBootstrapMissingError(error)) {
        return exports.NO_BOOTSTRAP;
      }
      throw error;
    });
  };

  function sendMessageStub(msg, sender, sendReply) {
    if (!msg) {
      return;
    }

    // TODO: revisit these provisional decisions
    if (msg.funcName === "isTelemetryEnabled") {
      sendReply({type: "success", value: true});
    } else if (msg.funcName === "isUploadDisabled") {
      sendReply({type: "success", value: false});
    } else if (msg.funcName === "isHistoryEnabled") {
      sendReply({type: "success", value: true});
    } else if (msg.funcName === "incrementCount") {
      const allowedScalars = ["download", "upload", "copy"];
      const scalar = msg.args && msg.args[0] && msg.args[0].scalar;
      if (!allowedScalars.includes(scalar)) {
        sendReply({type: "error", name: `incrementCount passed an unrecognized scalar ${scalar}`});
      } else {
        // TODO: load analytics.js and call sendEvent() here
        sendReply({type: "success", value: true});
      }
    }
  }

  function isBootstrapMissingError(error) {
    if (!error) {
      return false;
    }
    return ("errorCode" in error && error.errorCode === "NO_RECEIVING_END") ||
      (!error.errorCode && error.message === "Could not establish connection. Receiving end does not exist.");
  }


  // A singleton/sentinel (with a name):
  exports.NO_BOOTSTRAP = {name: "communication.NO_BOOTSTRAP"};

  return exports;
})();
