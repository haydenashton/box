$(document).ready(function(){

  var FileUploadComponent = React.createClass({displayName: "FileUploadComponent",
    selectFile: function(e){
      $("#fileElement").trigger("click");
    },

    fileSelected: function(){
      var filePath = $("#fileElement").val().split("\\");
      React.findDOMNode(this.refs.selectedFile).text = filePath[filePath.length-1];
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
            React.createElement("input", {onChange: this.fileSelected, type: "file", id: "fileElement", name: "file", ref: "fileUpload", style: {display:"none"}}), 
            React.createElement("button", {type: "button", className: "btn btn-default btn-small", onClick: this.selectFile}, "Select File"), React.createElement("br", null), React.createElement("br", null), 
            React.createElement("span", {ref: "selectedFile"}), 
            React.createElement("button", {type: "submit", className: "btn btn-primary"}, React.createElement("i", {className: "glyphicon glyphicon-cloud-upload"}), " Upload")
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
        React.createElement("div", {className: "row"}, 
          React.createElement("div", {className: "col-sm-2"}, 
            React.createElement(FileUploadComponent, {formSubmitted: this.formSubmitted})
          ), 
          React.createElement("div", {className: "col-sm-10"}, 
            React.createElement(FileListComponent, {fileDownloaded: this.fileDownloaded, files: this.state.files})
          )
        )
      );
    }
  });


  React.render(
    React.createElement(FileManagerComponent, {pollInterval: "30000", url: "/files?json"}),
    document.getElementById("app")
  );
});
