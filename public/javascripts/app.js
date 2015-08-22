$(document).ready(function(){

  var FileSelectComponent = React.createClass({
    fileSelected: function(){
      var filePath = $("#fileElement").val().split("\\");
      this.props.onFileSelected(filePath[filePath.length-1]);
    },

    selectFile: function(e){
      $("#fileElement").trigger("click");
    },

    render: function(){
      return (
        <div>
          <input onChange={this.fileSelected} type="file" id="fileElement" name="file" ref="fileUpload" style={{display:"none"}}/>
          <button type="button" className="btn btn-default btn-small" onClick={this.selectFile}>
            <i className="glyphicon glyphicon-folder-open"></i> Select File
          </button><br/><br/>
          <span ref="selectedFile">{this.props.currentFile}</span>
        </div>
      );
    }
  });

  var FileUploadComponent = React.createClass({
    getInitialState: function(){
      return {
        "currentFile": ""
      };
    },

    fileSelected: function(fileName){
      this.setState({currentFile: fileName});
    },

    onSubmit: function(e){
        e.preventDefault();
        var formData = new FormData($("#uploadForm")[0]);
        this.props.formSubmitted(formData);
    },

    render: function(){
      return (
        <div id="fileUploadComponent">
          <h3>Upload a File:</h3>
          <form id="uploadForm" onSubmit={this.onSubmit} encType="multipart/form-data">
            <div className="row">
              <div className="col-sm-5">
                <FileSelectComponent currentFile={this.state.currentFile} onFileSelected={this.fileSelected}/>
              </div>
              <div className="col-sm-7">
                <button type="submit" className="btn btn-primary"><i className="glyphicon glyphicon-cloud-upload"></i> Upload</button>
              </div>
            </div>
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

    formSubmitted: function(data){
      $.ajax({
        url: '/files',
        data: data,
        type: 'POST',
        processData: false,
        contentType: false
      }).done(function(result){
        if(result && result.nameOnDisk){
          var currentFiles = this.state.files;
          currentFiles.push(result);
          this.setState({files: currentFiles});
        }
      }.bind(this));
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
          <div className="col-sm-3">
            <FileUploadComponent formSubmitted={this.formSubmitted} />
          </div>
          <div className="col-sm-9">
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
});
