$(document).ready(function(){

  var FileSelectComponent = React.createClass({displayName: "FileSelectComponent",
    fileSelected: function(){
      var filePath = $("#fileElement").val().split("\\");
      this.props.onFileSelected(filePath[filePath.length-1]);
    },

    selectFile: function(e){
      $("#fileElement").trigger("click");
    },

    render: function(){
      return (
        React.createElement("div", null, 
          React.createElement("input", {onChange: this.fileSelected, type: "file", id: "fileElement", name: "file", ref: "fileUpload", style: {display:"none"}}), 
          React.createElement("button", {type: "button", className: "btn btn-default btn-small", onClick: this.selectFile}, 
            React.createElement("i", {className: "glyphicon glyphicon-folder-open"}), " Select File"
          ), React.createElement("br", null), React.createElement("br", null), 
          React.createElement("span", {ref: "selectedFile"}, this.props.currentFile)
        )
      );
    }
  });

  var FileUploadComponent = React.createClass({displayName: "FileUploadComponent",
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
        React.createElement("div", {id: "fileUploadComponent"}, 
          React.createElement("h3", null, "Upload a File:"), 
          React.createElement("form", {id: "uploadForm", onSubmit: this.onSubmit, encType: "multipart/form-data"}, 
            React.createElement("div", {className: "row"}, 
              React.createElement("div", {className: "col-sm-5"}, 
                React.createElement(FileSelectComponent, {currentFile: this.state.currentFile, onFileSelected: this.fileSelected})
              ), 
              React.createElement("div", {className: "col-sm-7"}, 
                React.createElement("button", {type: "submit", className: "btn btn-primary"}, React.createElement("i", {className: "glyphicon glyphicon-cloud-upload"}), " Upload")
              )
            )
          )
        )
      );
    }
  });


  var FileItemComponent = React.createClass({displayName: "FileItemComponent",
    render: function(){
      return (
        React.createElement("tr", {className: "fileItemComponent"}, 
          React.createElement("td", null, this.props.data.actualName), 
          React.createElement("td", null, this.formatDate(this.props.data.uploaded)), 
          React.createElement("td", null, this.props.data.numberOfDownloads), 
          React.createElement("td", null, this.props.data.lastDownload ? this.formatDate(this.props.data.lastDownload) : "Never"), 
          React.createElement("td", null, this.formatFileSize()), 
          React.createElement("td", null, 
            React.createElement("button", {type: "button", className: "btn btn-default", onClick: this.downloadFile}, 
              React.createElement("i", {className: "glyphicon glyphicon-download-alt"})
            )
          )
        )
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


  var FileListComponent = React.createClass({displayName: "FileListComponent",
    render: function(){
      var self = this;
      return (
        React.createElement("table", {className: "table", id: "fileListComponent"}, 
          React.createElement("thead", null, 
            React.createElement("tr", null, 
              React.createElement("th", null, "Name"), 
              React.createElement("th", null, "Uploaded"), 
              React.createElement("th", null, "Number of Downloads"), 
              React.createElement("th", null, "Last Download"), 
              React.createElement("th", null, "Size"), 
              React.createElement("th", null)
            )
          ), 
          React.createElement("tbody", null, 
            this.props.files.map(function(file){
              return React.createElement(FileItemComponent, {fileId: file._id, fileDownloaded: self.props.fileDownloaded, key: file._id, data: file});
            })
          )
        )
      );
    }
  });

  var FileManagerComponent = React.createClass({displayName: "FileManagerComponent",
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
        React.createElement("div", null, 
          React.createElement("div", {className: "row"}, 
            React.createElement("h2", null, "Folder: ", this.props.folderName)
          ), 
          React.createElement("div", {className: "row"}, 
            React.createElement("div", {className: "col-sm-3"}, 
              React.createElement(FileUploadComponent, {formSubmitted: this.formSubmitted})
            ), 
            React.createElement("div", {className: "col-sm-9"}, 
              React.createElement(FileListComponent, {fileDownloaded: this.fileDownloaded, files: this.state.files})
            )
          )
        )
      );
    }
  });


  var FolderCreator = React.createClass({displayName: "FolderCreator",
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
        React.createElement("div", {className: "modal fade newFolderModal"}, 
          React.createElement("div", {className: "modal-dialog"}, 
            React.createElement("div", {className: "modal-content"}, 
              React.createElement("div", {className: "modal-header"}, 
                React.createElement("button", {type: "button", className: "close", "data-dismiss": "modal", "aria-label": "Close"}, 
                  React.createElement("span", {"aria-hidden": "true"}, "×")
                ), 
                React.createElement("h4", {className: "modal-title"}, "Create New Folder")
              ), 
              React.createElement("div", {className: "modal-body"}, 
                React.createElement("label", null, "Folder Name:"), 
                React.createElement("input", {type: "text", className: "form-control", ref: "newFolderName"})
              ), 
              React.createElement("div", {className: "modal-footer"}, 
                React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "Close"), 
                React.createElement("button", {type: "button", className: "btn btn-primary", "data-dismiss": "modal", onClick: this.createFolder}, "Save changes")
              )
            )
          )
        )
      );
    }
  });


  var FolderComponent = React.createClass({displayName: "FolderComponent",
    selected: function(){
      this.props.folderSelected(this.props.folder);
    },

    render: function(){
      return (
        React.createElement("div", {className: "folder", onClick: this.selected}, 
          this.props.folder.name
        )
      );
    }
  });

  var FolderManagerComponent = React.createClass({displayName: "FolderManagerComponent",
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
          React.createElement(FolderComponent, {folderSelected: self.folderSelected, folder: folder, key: folder._id})
        );
      });

      var folderModal = (this.state.creatingFolder) ? React.createElement(FolderCreator, {createFolder: this.createFolder}) : '';

      return (
        React.createElement("div", {className: "folders"}, 
          React.createElement("h2", null, "Folders"), 
          React.createElement("button", {type: "button", className: "btn btn-primary", id: "newFolder", onClick: this.promptCreateFolder}, 
            React.createElement("i", {className: "glyphicon glyphicon-folder-close"}), " Create Folder"
          ), 
          React.createElement("div", {className: "clear"}), 
          folderComponents, 
          folderModal
        )
      );
    }
  });


  var Nav = React.createClass({displayName: "Nav",
    render: function(){
      return (
        React.createElement("div", null, 
          React.createElement("button", {type: "button", className: "pull-right btn btn-default", onClick: this.props.goHome}, 
            React.createElement("i", {className: "glyphicon glyphicon-home"}), " Home"
          )
        )
      );
    }
  });


  var App = React.createClass({displayName: "App",
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
        React.createElement(FileManagerComponent, {pollInterval: "30000", folder: this.state.requestedFolder}) :
        React.createElement(FolderManagerComponent, {folderRequested: this.folderRequested});
      return (
        React.createElement("div", null, 
          React.createElement("h1", null, "File Browser"), 
          React.createElement(Nav, {goHome: this.clearFolder}), 
          component
        )
      );
    }
  });

  React.render(
    React.createElement(App, null),
    document.getElementById("app")
  );
});
