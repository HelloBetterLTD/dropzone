const DropzoneLib = require('dropzone');
const fields = document.getElementsByClassName('js-upload');

const PortalImageUpload = function(field){
    this.field = field;
    this.droparea = field.getElementsByClassName('uploader-dropzone')[0];
    this.preview = field.getElementsByClassName('uploader-preview')[0];
    this.button = field.getElementsByClassName('uploader-button')[0];
    this.idsInput = field.getElementsByClassName('js-upload-ids')[0];
    this.form = this.FindAncestor(this.droparea, 'FORM');
    this.securityID = typeof this.form.SecurityID !== 'undefined' ? this.form.SecurityID.value : null;
    this.imagesJSON = field.dataset.images;
​
    this.handleAccept = this.handleAccept.bind(this);
    this.handleSending = this.handleSending.bind(this);
    this.handleSuccess = this.handleSuccess.bind(this);
    this.showHideDropZone = this.showHideDropZone.bind(this);
    this.deleteEndPoint = field.dataset.deleteendpoint;
​
​
    this.dropzone = new DropzoneLib( this.droparea, {
        init                : function() {
        },
        url                 : field.dataset.uploadendpoint,
        accept              : this.handleAccept,
        sending             : this.handleSending,
        success             : this.handleSuccess,
        previewsContainer   : this.preview,
        maxFiles            : field.dataset.numberoffiles,
        clickable           : this.button
    });
​
​
    if(this.imagesJSON) {
        let json = JSON.parse(this.imagesJSON);
        for(const uploadedImage of json) {
            this.addFile(uploadedImage);
        }
    }
​
    this.showHideDropZone();
    window.dropzone = this.dropzone;
​
};
​

PortalImageUpload.prototype = {
​
​
    addFile : function(file) {
        let url = file.thumbnail;
        console.log(url);
        if(typeof file.smallThumbnail !== 'undefined') {
            url = file.smallThumbnail;
        }
        let html = '<div class="file-preview" data-id="' + file.id + '">' +
            '<div class="file-image"><img src="' + url + '"></div>' +
            '<div class="file-details">' + file.size + '<br>' + file.name + '</div>' +
            '<div class="file-delete">' +
            '<a href="#delete" class="js-delete">X</a>' +
            '</div>' +
            '<input type="hidden" class="js-uploaded-file" name="' + this.field.dataset.name + '[Files][]" value="' + file.id + '" />' +
            '</div>';
​
        let div = document.createElement('div');
        div.innerHTML = html;
        div.getElementsByClassName('js-delete')[0].addEventListener('click', this.deleteFile.bind(this));
        this.preview.appendChild(div);
    },
​
    deleteFile: function(e){
        e.preventDefault();
        let preview = e.target.parentElement.parentElement;
        let id = preview.dataset.id;
        let data = new FormData();
        data.append('id', id);
        if(this.securityID) {
            data.append('SecurityID', this.securityID);
        }
        let oReq = new XMLHttpRequest();
        oReq.onload = (e) => {
            if(e.target.status === 200) {
                let previewHolder = preview.parentElement;
                previewHolder.parentNode.removeChild(previewHolder);
                this.showHideDropZone();
            }
        };
        oReq.open('POST', this.deleteEndPoint);
        oReq.send(data);
        return false;
    },
​
    handleAccept: function (file, done) {
        let errors = this.ValidateFile(file);
        if(errors.length) {
            return done(errors.join('\n'));
        }
        return done();
    },
​
    handleSending: function (file, xhr, formData) {
        if(this.securityID) {
            formData.append('SecurityID', this.securityID);
        }
    },
​
    FindAncestor :  function (el, tagName) {
        while ((el = el.parentElement) && el.tagName != tagName);
        return el;
    },
​
​
    ValidateFile: function (file) {
        const errors = [];
        const dataset = this.field.dataset;
        if(dataset.size != 0 && file.size > dataset.size){
            errors.push('Max file size is 1MB');
        }
​
        if(dataset.extensions) {
            const extensions = dataset.extensions.split(',');
            const extension = file.name.split('.').pop();
            if(extensions.indexOf(extension) == -1) {
                errors.push('JPG or PNG only')
            }
        }
​
        return errors;
    },
​
    handleSuccess: function (file) {
        let response = JSON.parse(file.xhr.response);
        for(const fileData of response) {
            this.addFile(fileData);
        }
​
        this.showHideDropZone();
        this.dropzone.removeFile(file);
    },

showHideDropZone: function() {
    let inputs = this.field.getElementsByClassName('js-uploaded-file');
    if(inputs.length >= this.field.dataset.numberoffiles) {
        this.droparea.style = 'display: none';
    }
    else {
        this.droparea.style = 'display: flex';
    }
}
​
}
​
if(fields && fields.length) {
    for(const field of fields) {
        const uploader = new PortalImageUpload(field);
    }
}
​
​
