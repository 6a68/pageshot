/* globals location */
const sendEvent = require("../../browser-send-event.js");
const reactruntime = require("../../reactruntime");
const React = require("react");

class Head extends React.Component {

  render() {
    return (
      <reactruntime.HeadTemplate {...this.props}>
        <script src={this.props.staticLink("/static/js/leave-bundle.js")} async></script>
        <link rel="stylesheet" href={ this.props.staticLink("/static/css/warning-page.css") } />
      </reactruntime.HeadTemplate>
    );
  }

}

class Body extends React.Component {

  render() {
    if (this.props.complete) {
      return this.renderComplete();
    }
    return (
      <reactruntime.BodyTemplate {...this.props}>
        <div className="column-center full-height inverse-color-scheme">
          <div className="large-icon-message-container">
            <div className="large-icon logo" />
            <div className="large-icon-message-string">
              This will permanently erase all of your Firefox Screenshots data. <!-- todo l10n: leavePageWarning -->
            </div>
            <form action="/leave-screenshots/leave" method="POST" className="responsive-wrapper row-center">
              <input type="hidden" name="_csrf" value={this.props.csrfToken} />
              <button type="submit" onClick={ this.onClickDelete.bind(this) } className="button warning">
                Proceed <!-- todo l10n: leavePageButtonProceed -->
              </button>
              <a href="/shots" onClick={ this.onClickCancel.bind(this) } className="cancel-delete">cancel</a> <!-- todo l10n: leavePageButtonCancel -->
            </form>
          </div>
        </div>
      </reactruntime.BodyTemplate>
    );
  }

  renderComplete() {
    return (
      <reactruntime.BodyTemplate {...this.props}>
        <div className="column-center full-height inverse-color-scheme">
          <div className="large-icon-message-container">
            <div className="large-icon check" />
            <div className="large-icon-message-string">All of your Firefox Screenshots data has been erased. <!-- todo l10n: leavePageDeleted-->
            </div>
          </div>
        </div>
      </reactruntime.BodyTemplate>
    );
  }

  onClickDelete() {
    sendEvent("leave-service", "leave-button", {useBeacon: true});
  }

  onClickCancel() {
    sendEvent("cancel-leave", "cancel-link", {useBeacon: true});
  }

}

exports.HeadFactory = React.createFactory(Head);
exports.BodyFactory = React.createFactory(Body);
