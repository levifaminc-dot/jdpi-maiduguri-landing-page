import {parentPort,workerData} from 'node:worker_threads';
import {PDFDocument,PDFDict,PDFArray,PDFName,PDFRawStream,ParseSpeeds} from 'pdf-lib';
try {
  const pdf=await PDFDocument.load(workerData,{ignoreEncryption:false,throwOnInvalidObject:true,updateMetadata:false,parseSpeed:ParseSpeeds.Fastest});
  const pages=pdf.getPages();if(!pages.length || pages.length>200) throw new Error();
  for(const page of pages){const {width,height}=page.getSize();if(!Number.isFinite(width+height) || Math.min(width,height)<10 || Math.max(width,height)>14400)throw new Error();}
  const blockedKeys=new Set(['JS','JavaScript','AA','XFA','EmbeddedFiles','EF','RichMediaContent','RichMediaSettings','Collection']);
  const blockedNames=new Set(['JavaScript','Launch','GoToR','GoToE','SubmitForm','ImportData','Rendition','Movie','Sound','EmbeddedFile','Filespec']);
  const seen=new WeakSet();let nodes=0;
  function inspect(object) {
    if(!object || typeof object!=='object' || seen.has(object))return;
    seen.add(object);if(++nodes>50000)throw new Error();
    if(object instanceof PDFName){if(blockedNames.has(object.decodeText()))throw new Error();}
    else if(object instanceof PDFDict){for(const [key,value] of object.entries()){if(blockedKeys.has(key.decodeText()))throw new Error();inspect(value);}}
    else if(object instanceof PDFArray){for(let i=0;i<object.size();i++)inspect(object.get(i));}
    else if(object instanceof PDFRawStream)inspect(object.dict);
  }
  inspect(pdf.catalog);for(const [,object]of pdf.context.enumerateIndirectObjects())inspect(object);
  parentPort.postMessage({ok:true,pages:pages.length});
} catch {parentPort.postMessage({ok:false});}
