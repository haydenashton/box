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
      this.setState({ currentFile: fileName });
    },

    onSubmit: function(e){
        e.preventDefault();
        var formElement = $("#uploadForm");
        if(formElement && formElement.length) {
          var formData = new FormData(formElement[0]);
          this.props.formSubmitted(formData);
        }
    },

    hasFileSelected: function() {
      return this.state.currentFile !== "";
    },

    render: function() {
      return (
        <div id="fileUploadComponent">
          <h3>Upload a File:</h3>
          <form id="uploadForm" onSubmit={this.onSubmit} encType="multipart/form-data">
            <div className="row">
              <div className="col-sm-5">
                <FileSelectComponent currentFile={this.state.currentFile} onFileSelected={this.fileSelected}/>
              </div>
              <div className="col-sm-7">
                <button disabled={!this.hasFileSelected()} type="submit" className="btn btn-primary"><i className="glyphicon glyphicon-cloud-upload"></i> Upload</button>
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
        "files": [],
        "intervalId": ""
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
        url: '/files?folder=' + this.props.folder._id,
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
        url: "/files?folder=" + this.props.folder._id,
        dataType: "json",
        success: function(data){
          this.setState({files: data.files});
        }.bind(this),
        error: function(xhr, status, err){
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
    },

    componentDidMount: function() {
      this.loadFilesFromServer();
      var intervalId = setInterval(this.loadFilesFromServer, this.props.pollInterval);
      this.setState({"intervalId": intervalId});
    },

    componentWillUnmount: function(){
      clearInterval(this.state.intervalId);
    },

    render: function(){
      return (
        <div>
          <div className="row">
            <h2>Folder: {this.props.folderName}</h2>
          </div>
          <div className="row">
            <div className="col-sm-3">
              <FileUploadComponent formSubmitted={this.formSubmitted} />
            </div>
            <div className="col-sm-9">
              <FileListComponent fileDownloaded={this.fileDownloaded} files={this.state.files}/>
            </div>
          </div>
        </div>
      );
    }
  });


  var FolderCreator = React.createClass({
    createFolder: function(){
      var folderName = React.findDOMNode(this.refs.newFolderName).value;

      if(folderName.trim()){
        this.props.createFolder(folderName);
        React.findDOMNode(this.refs.newFolderName).value = '';
      }
    },

    componentDidMount: function(){
        $(".newFolderModal").modal();
    },

    render: function(){
      return (
        <div className="modal fade newFolderModal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title">Create New Folder</h4>
              </div>
              <div className="modal-body">
                <label>Folder Name:</label>
                <input type="text" className="form-control" ref="newFolderName"/>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
                <button type="button" className="btn btn-primary" data-dismiss="modal" onClick={this.createFolder}>Save changes</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  });


  var FolderComponent = React.createClass({
    selected: function(){
      this.props.folderSelected(this.props.folder);
    },

    render: function(){
      return (
        <div className="folder" onClick={this.selected}>
          <span className="glyphicon glyphicon-folder-open"> </span>&nbsp;&nbsp;
          {this.props.folder.name}
        </div>
      );
    }
  });

  var FolderManagerComponent = React.createClass({
    getInitialState: function(){
      return {
        folders: folders,
        creatingFolder: false
      };
    },

    folderSelected: function(folder){
      this.props.folderRequested(folder);
    },

    promptCreateFolder: function(){
      this.setState({"creatingFolder": true});
    },

    createFolder: function(folderName){
      var data = {
        "name": folderName,
        "parent": null
      };

      $.ajax({
        url: '/folders',
        data: data,
        type: 'POST'
      }).done(function(result){
        var currentFolders = this.state.folders;
        currentFolders.push(result);
        this.setState({folders: currentFolders, creatingFolder: false});
      }.bind(this));
    },

    render: function(){
      var self = this;
      var folderComponents = this.state.folders.map(function(folder){
        return (
          <FolderComponent folderSelected={self.folderSelected} folder={folder} key={folder._id}/>
        );
      });

      var folderModal = (this.state.creatingFolder) ? <FolderCreator createFolder={this.createFolder} /> : '';

      return (
        <div className="folders">
          <h2>Folders</h2>
          <button type="button" className="btn btn-primary" id="newFolder" onClick={this.promptCreateFolder}>
            <i className="glyphicon glyphicon-folder-close"></i> Create Folder
          </button>
          <div className="clear"></div>
          {folderComponents}
          {folderModal}
        </div>
      );
    }
  });


  var Nav = React.createClass({
    render: function(){
      return (
        <div>
          <button type="button" className="pull-right btn btn-default" onClick={this.props.goHome}>
            <i className="glyphicon glyphicon-home"></i> Home
          </button>
        </div>
      );
    }
  });


  var App = React.createClass({
    getInitialState: function(){
      return {
        requestedFolder: null
      };
    },

    folderRequested: function(folder){
      this.setState({requestedFolder: folder});
    },

    clearFolder: function(){
      this.folderRequested(null);
    },

    render: function(){
      var component = (this.state.requestedFolder) ?
        <FileManagerComponent pollInterval="30000" folder={this.state.requestedFolder}/> :
        <FolderManagerComponent folderRequested={this.folderRequested} />;
      return (
        <div>
          <h1>File Browser</h1>
          <Nav goHome={this.clearFolder}/>
          {component}
        </div>
      );
    }
  });

  React.render(
    <App />,
    document.getElementById("app")
  );
});
