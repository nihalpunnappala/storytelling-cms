// src/components/ImageUploader.js
import React, { useRef, useState, useEffect } from "react";
import { FileContainer, Input } from "./styles";
import CustomLabel from "./label";
import { noimage, doc } from "../../../images";
import { IconButton } from "../elements";
import InfoBoxItem from "./info";
import { SubPageHeader } from "./heading";
import Footnote from "./footnote";
import ErrorLabel from "./error";
import ImageCropperV2 from "./ImageCropperV2";
import { GetIcon } from "../../../icons";
import { Upload, CheckCircle2, EditIcon } from "lucide-react";
import MultipleImageUploader from "./MultipleImageUploader";

const ImageUploader = (props) => {
  const { multiple = false } = props;

  if (multiple) {
    return <MultipleImageUploader {...props} />;
  }

  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  function formatSize(sizeInBytes) {
    if (sizeInBytes < 1024) return sizeInBytes + " bytes";
    else if (sizeInBytes < 1024 * 1024) return (sizeInBytes / 1024).toFixed(2) + " KB";
    else return (sizeInBytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  const size = formatSize(props.value?.[0] ? props.value[0].size : 0);
  const image = props.formValues?.["old_" + props.name] ?? "";

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handlePreviewClick = () => {
    setIsCropModalOpen(true);
  };

  const closeCropModal = () => {
    setIsCropModalOpen(false);
  };

  const handleCropComplete = (file) => {
    setPreviewImage(URL.createObjectURL(file));
    const customEvent = {
      target: {
        files: [file],
      },
    };
    props.onChange(customEvent, props.id, props.type);
  };

  const onchange = (event) => {
    const file = event.target.files[0];
    if (props.type === "image" && file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      setPreviewImage(file);
    }
    props.onChange(event, props.id, props.type);
  };

  // Paste support
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            setPreviewImage(event.target.result);
          };
          reader.readAsDataURL(file);

          const syntheticEvent = {
            target: {
              files: [file],
            },
          };
          props.onChange(syntheticEvent, props.id, props.type);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  return (
    <FileContainer className={`${props.customClass ?? "full"} ${props.dynamicClass ?? ""}`}>
      <CustomLabel name={props.name} className={`${props.dynamicClass ?? ""}`} label={props.label} required={props.required} sublabel={props.sublabel} error={props.error ?? ""} />
      <div className="border border-dashed border-gray-300 rounded-md p-2">
        <div>
          {props.type === "file" ? (
            previewImage ? (
              <div className="flex items-center justify-between cursor-pointer w-[70px] h-[50px] border border-dashed border-gray-300 rounded-md px-3" onClick={handleButtonClick}>
                <div className="flex items-center gap-2">
                  <EditIcon className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center cursor-pointer w-[70px] h-[50px] border border-dashed border-gray-300 rounded-md" onClick={handleButtonClick}>
                <Upload className="w-6 h-6 text-gray-500" />
              </div>
            )
          ) : image ? (
            <div className="flex items-center justify-center cursor-pointer w-[70px] h-[50px] border border-dashed border-gray-300 rounded-md" onClick={handleButtonClick}>
              <img alt="upload" className="contain" onClick={handlePreviewClick} src={previewImage ? previewImage : image ? import.meta.env.VITE_CDN + image : props.type === "image" ? noimage : doc} />
            </div>
          ) : previewImage ? (
            <div className="flex items-center justify-center cursor-pointer w-[70px] h-[50px] border border-dashed border-gray-300 rounded-md" onClick={handleButtonClick}>
              <img alt="upload" className="contain" onClick={handleButtonClick} src={previewImage} />
            </div>
          ) : (
            <div className="flex items-center justify-center cursor-pointer w-[70px] h-[50px] border border-dashed border-gray-300 rounded-md" onClick={handleButtonClick}>
              <Upload className="w-6 h-6 text-gray-500" />
            </div>
          )}

          {/* 📋 Paste tip */}
          <p className="text-xs text-gray-400 mt-1 text-center">Or paste an image here (Ctrl+V or Cmd+V)</p>

          {props.update && props.formType === "put" && <IconButton ClickEvent={handleButtonClick} align="imageedit" icon="pen" />}

          {props.type === "image" && previewImage && (
            <div className="flex items-center gap-2 rounded-md px-2 py-1 text-xs cursor-pointer mt-2 text-gray-500 border border-gray-200" onClick={handlePreviewClick}>
              <GetIcon icon={"crop"} /> <span>Crop</span>
            </div>
          )}
        </div>

        <div>
          {multiple && <div className="flex items-center gap-2">Multiple</div>}
          {props.value?.size && (
            <div className="flex items-center justify-start gap-2 mt-0 mb-1 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="truncate max-w-[200px]">
                {props.value.name?.length > 10 ? `${props.value.name.substring(0, 10)}...` : props.value.name} ({(props.value.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            </div>
          )}

          <InfoBoxItem info={props.info} />
          <SubPageHeader dynamicClass="custom" line={false} description={props.value?.length > 0 ? `File size: ${size} <br /> Supported file types: ${props.type === "image" ? "JPG, JPEG, PNG, GIF, WEBP" : "Images and Documents"}` : `File size: Up to 5MB <br /> Supported file types: ${props.type === "image" ? "JPG, JPEG, PNG, GIF, WEBP" : "Images and Documents"} ${props.aspectHeight && props.aspectWidth ? `<br /> Recommended ratio: ${props.aspectHeight}:${props.aspectWidth}` : ""}`} />
          <Footnote {...props} />
          <ErrorLabel error={props.error} info={props.info} />

          <Input name={props.name} disabled={props.disabled} ref={fileInputRef} style={{ display: "none" }} accept={props.type === "image" ? `image/*` : ``} className={`input ${props.value?.length > 0 ? "shrink" : ""}`} placeholder={props.placeholder} type={`file`} onChange={onchange} multiple={multiple} />

          {isCropModalOpen && props.type === "image" && previewImage && <ImageCropperV2 image={previewImage} onCropComplete={handleCropComplete} onClose={closeCropModal} aspectHeight={props.aspectHeight} aspectWidth={props.aspectWidth} />}
        </div>
      </div>
    </FileContainer>
  );
};

export default ImageUploader;
