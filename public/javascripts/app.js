$(document).ready(function(){

  var FileUploadComponent = React.createClass({
    render: function(){
      return (
        <div id="fileUploadComponent">
          <h3>Upload a File:</h3>
          <form action="/files" method="POST" encType="multipart/form-data">
            <input type="file" id="fileElement" name="file"/><br/>
            <input type="submit" className="btn btn-primary" value="Upload"/>
          </form>
        </div>
      );
    }
  });


  var FileItemComponent = React.createClass({
    render: function(){
      return (
        <tr className="fileItemComponent">
          <td>{this.props.data.actualName}</td>
          <td>{this.formatDate(this.props.data.uploaded)}</td>
          <td>{this.props.data.numberOfDownloads}</td>
          <td>{this.props.data.lastDownload ? this.formatDate(this.props.data.lastDownload) : "Never"}</td>
          <td>{this.formatFileSize()}</td>
          <td>
            <button type="button" className="btn btn-default" onClick={this.downloadFile}>
              <i className="glyphicon glyphicon-download-alt"></i>
            </button>
          </td>
        </tr>
     );
    },

    formatDate: function(date){
      return moment(date).format('MMMM Do YYYY, h:mm a');
    },

    formatFileSize: function(){
      if(this.props.data.size/1024 < 1024){
        return (this.props.data.size / 1024).toFixed(2) + "kb";
      }
      return (this.props.data.size / 1024 / 1024).toFixed(2) + "mb";
    },

    downloadFile: function(){
      window.location = "/files/" + this.props.data._id;
      this.props.fileDownloaded(this.props.fileId);
    }
  });


  var FileListComponent = React.createClass({
    render: function(){
      var self = this;
      return (
        <table className="table" id="fileListComponent">
          <thead>
            <tr>
              <th>Name</th>
              <th>Uploaded</th>
              <th>Number of Downloads</th>
              <th>Last Download</th>
              <th>Size</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {this.props.files.map(function(file){
              return <FileItemComponent fileId={file._id} fileDownloaded={self.props.fileDownloaded} key={file._id} data={file}/>;
            })}
          </tbody>
        </table>
      );
    }
  });

  var FileManagerComponent = React.createClass({
    getInitialState: function(){
      return {
        "files": files
      };
    },

    fileDownloaded: function(fileId){
      var currentFiles = this.state.files;
      for(var i in currentFiles){
        if(currentFiles[i]._id == fileId){
          currentFiles[i].numberOfDownloads += 1;
          currentFiles[i].lastDownload = new Date();
        }
      }
      this.setState({files: currentFiles});
    },

    loadFilesFromServer: function(){
      $.ajax({
        url: this.props.url,
        dataType: "json",
        success: function(data){
          this.setState({files: data});
        }.bind(this),
        error: function(xhr, status, err){
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
    },

    componentDidMount: function() {
      setInterval(this.loadFilesFromServer, this.props.pollInterval);
    },

    render: function(){
      return (
        <div className="row">
          <div className="col-sm-2">
            <FileUploadComponent />
          </div>
          <div className="col-sm-10">
            <FileListComponent fileDownloaded={this.fileDownloaded} files={this.state.files}/>
          </div>
        </div>
      );
    }
  });


  React.render(
    <FileManagerComponent pollInterval="30000" url="/files?json"/>,
    document.getElementById("app")
  );
  $("#fileListComponent").dataTable({
    "columnDefs": [
      { "orderable": false, "targets": 5 }
    ]
  });
});
