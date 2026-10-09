import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';

// Keep ONE readline/raw-mode owner for the complete confirmation/password flow.
// Closing then reopening a Windows console reader can fail with setRawMode EPERM.
export function privateTerminal(input=process.stdin,output=process.stdout) {
  let hidden=false, failed=false;
  const protectedOutput=new Writable({write(chunk,_encoding,done){
    if(!hidden) output.write(chunk);
    done();
  }});
  protectedOutput.columns=output.columns || 80;
  const reader=createInterface({input,output:protectedOutput,terminal:true,historySize:0});
  reader.on('error',()=>{failed=true;reader.close();});
  return {
    async visible(prompt) {
      hidden=false;
      if(failed) throw new Error('Private terminal unavailable.');
      return reader.question(prompt);
    },
    async secret(prompt) {
      hidden=true;
      if(failed) throw new Error('Private terminal unavailable.');
      output.write(prompt);
      try {return await reader.question('');}
      finally {output.write('\n');}
    },
    close(){reader.close();},
  };
}
