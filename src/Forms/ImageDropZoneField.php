<?php
/**
 * Created by PhpStorm.
 * User: Acer
 * Date: 2/6/2020
 * Time: 4:41 PM
 */

namespace Dropzone\Forms;

use SilverStripe\AssetAdmin\Controller\AssetAdmin;
use SilverStripe\Assets\File;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Control\HTTPResponse;
use SilverStripe\Core\Convert;
use SilverStripe\Forms\FileUploadReceiver;
use SilverStripe\Forms\FormField;
use SilverStripe\ORM\ArrayList;
use SilverStripe\ORM\SS_List;
use SilverStripe\Versioned\Versioned;
use SilverStripe\View\Requirements;

class ImageDropZoneField extends FormField
{
    use FileUploadReceiver;

    private static $allowed_actions = [
        'upload',
        'delete'
    ];
​
    private $numberOfFiles = 1;
    private $width = 0;
    private $height = 0;
    private $size = 1;
    private $extensions = [];
    protected $inputType = 'hidden';
​
    public function __construct($name, $title = null, $items = null)
    {
        $this->constructFileUploadReceiver();
        // When creating new files, rename on conflict
        $this->getUpload()->setReplaceFile(false);
        parent::__construct($name, $title);
        ​
		if ($items) {
            if(!is_a($items, SS_List::class)) {
                $this->setItems(new ArrayList([
                    $items
                ]));
            }
            else {
                $this->setItems($items);
            }
        }
	}
​
    public function Field($properties = array())
    {
        Requirements::javascript('client/dist/js/image-upload.js');
        return parent::Field($properties);
    }
​
    public function getFiles()
    {
        $ids = $this->getItemIDs();
        $files = File::get()->filter('ID', $ids);
        return $files;
    }
​
    public function getFilesJSON()
    {
        $ids = $this->getItemIDs();
        $data = [];
        if(!empty($ids)) {
            $files = File::get()->filter('ID', $ids);
            foreach ($files as $file) {
                $data[] = [
                    'id' => $file->ID,
                    'name' => $file->Name,
                    'size' => $file->getSize(),
                    'type' => $file->getMimeType(),
                    'smallThumbnail' => $file->ThumbnailURL(70, 70)
                ];
            }
        }
        return Convert::raw2htmlatt(Convert::array2json($data));
    }
​
    public function upload(HTTPRequest $request)
    {
        ​
		if ($this->isDisabled() || $this->isReadonly()) {
            return $this->httpError(403);
        }
​
		// CSRF check
		$token = $this->getForm()->getSecurityToken();
		if (!$token->checkRequest($request)) {
            return $this->httpError(400);
        }
​
​
		$tmpFile = $request->postVar('file');
		$file = $this->saveTemporaryFile($tmpFile, $error);
		if ($error) {
            $result = [
                'message' => [
                    'type' => 'error',
                    'value' => $error,
                ]
            ];
            $this->getUpload()->clearErrors();
            return (new HTTPResponse(json_encode($result), 400))
                ->addHeader('Content-Type', 'application/json');
        }
​
		// Return success response
		$result = [
            AssetAdmin::singleton()->getObjectFromData($file)
        ];
​
		// Don't discard pre-generated client side canvas thumbnail
		if ($result[0]['category'] === 'image') {
            unset($result[0]['thumbnail']);
        }
		$this->getUpload()->clearErrors();
		return (new HTTPResponse(json_encode($result)))
            ->addHeader('Content-Type', 'application/json');
​
	}
​
    public function delete(HTTPRequest $request)
    {
        if ($this->isDisabled() || $this->isReadonly()) {
            return $this->httpError(403);
        }
        ​
		// CSRF check
		$token = $this->getForm()->getSecurityToken();
		if (!$token->checkRequest($request)) {
            return $this->httpError(400);
        }
​
​
		$fileID = $request->postVar('id');
		if($file = File::get()->byID($fileID)) {
            $file->deleteFromChangeSets();
            $file->doUnpublish();
            $file->deleteFromStage(Versioned::DRAFT);
            $file->deleteFile();
            $result = [
                'success'		=> 1
            ];
            $this->getUpload()->clearErrors();
            return (new HTTPResponse(json_encode($result), 200))
                ->addHeader('Content-Type', 'application/json');
        }
		return $this->httpError(400);
	}
​
​
    public function setNumberOfFiles($numberOfFiles)
    {
        $this->numberOfFiles = $numberOfFiles;
        return $this;
    }
​
    public function getNumberOfFiles()
    {
        return $this->numberOfFiles;
    }
​
    public function setAllowedExtensions($extensions)
    {
        $this->extensions = $extensions;
        return $this;
    }
​
    public function getExtensionsCSV()
    {
        return implode(',', $this->extensions);
    }
​
    public function setWidth($width)
    {
        $this->width = $width;
        return $this;
    }
​
    public function getWidth()
    {
        return $this->width;
    }
​
    public function setHeight($height)
    {
        $this->height = $height;
        return $this;
    }
​
    public function getHeight()
    {
        return $this->height;
    }
​
    public function setSize($size)
    {
        $this->size = $size;
        return $this;
    }
​
    public function getSize()
    {
        return $this->size * 1024 * 1024;
    }

}