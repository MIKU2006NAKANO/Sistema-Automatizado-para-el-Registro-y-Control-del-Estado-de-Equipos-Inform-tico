import type { Signal } from './types';
// Direct LAN ICE only: no cloud STUN, TURN, audio, data channels or recording.
export class ScreenPeer {
 readonly connection:RTCPeerConnection;
 private pending:RTCIceCandidateInit[]=[];
 private chain:Promise<void>=Promise.resolve();
 private closed=false;
 private timer:ReturnType<typeof setTimeout>|undefined;
 constructor(private session:string,private send:(signal:unknown)=>boolean,private onFailure:()=>void,onStream?:(stream:MediaStream)=>void,onConnected?:()=>void){
  this.connection=new RTCPeerConnection({iceServers:[],bundlePolicy:'max-bundle'});
  this.connection.onicecandidate=event=>{if(event.candidate&&!this.closed)this.send({type:'signal',session_id:this.session,candidate:event.candidate.toJSON()});};
  this.connection.ontrack=event=>{if(event.track.kind==='video')onStream?.(event.streams[0]||new MediaStream([event.track]));};
  this.connection.onconnectionstatechange=()=>{if(this.closed)return;const state=this.connection.connectionState;clearTimeout(this.timer);if(state==='connected')onConnected?.();else if(state==='failed')this.onFailure();else if(state==='disconnected')this.timer=setTimeout(()=>this.onFailure(),8000);};
 }
 async offer(stream:MediaStream){const track=stream.getVideoTracks()[0];if(!track)throw new Error('No se autorizó una pantalla de vídeo.');track.contentHint='detail';const transceiver=this.connection.addTransceiver(track,{direction:'sendonly',streams:[stream],sendEncodings:[{maxBitrate:700000,maxFramerate:8}]});const params=transceiver.sender.getParameters();if(params.encodings?.length){params.encodings[0].maxBitrate=700000;params.encodings[0].maxFramerate=8;await transceiver.sender.setParameters(params);}await this.connection.setLocalDescription(await this.connection.createOffer());if(!this.closed&&!this.send({type:'signal',session_id:this.session,sdp:this.connection.localDescription?.toJSON()}))throw new Error('Se perdió la señalización.');}
 receive(message:Signal){this.chain=this.chain.then(async()=>{if(this.closed)return;if(message.sdp){await this.connection.setRemoteDescription(message.sdp);for(const candidate of this.pending.splice(0))await this.connection.addIceCandidate(candidate);if(message.sdp.type==='offer'){await this.connection.setLocalDescription(await this.connection.createAnswer());if(!this.closed)this.send({type:'signal',session_id:this.session,sdp:this.connection.localDescription?.toJSON()});}}else if(message.candidate){if(this.connection.remoteDescription)await this.connection.addIceCandidate(message.candidate);else this.pending.push(message.candidate);}}).catch(()=>{if(!this.closed)this.onFailure();});return this.chain;}
 close(){if(this.closed)return;this.closed=true;clearTimeout(this.timer);this.connection.ontrack=null;this.connection.onconnectionstatechange=null;this.connection.onicecandidate=null;for(const sender of this.connection.getSenders())sender.track?.stop();for(const receiver of this.connection.getReceivers())receiver.track?.stop();this.connection.close();this.pending=[];}
}
