import {Component} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {WebcamImage} from 'ngx-webcam';
import axios from 'axios';

@Component({
  selector: 'app-body',
  templateUrl: './core.body.html',
  // styleUrls: ['./app.component.css']
})

export class BodyComponent {
  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();
  private capturedImage = null;
  public detectedFaces = [];

  constructor() {
    // setInterval(this.triggerSnapshot, 10000);
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public handleImage(webcamImage: WebcamImage): void {
    console.log(webcamImage);
    this.capturedImage = webcamImage.imageAsDataUrl;

    // create a blob and send as a byte array
    const s = this.capturedImage.split(',');
    const blob = this.b64toBlob(s[1]);
    this.makeAzureRequest(blob);
  }

  public getCapturedImage(): string {
    return this.capturedImage;
  }

  public makeAzureRequest(blob: Blob): void {
    const subscriptionKey = '9cf77d3c9d92490cabeb9d89722303b5';
    const url = 'https://centralindia.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false&returnFaceAttributes=age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,blur,exposure,noise';

    const config = {
      headers: {'content-type': 'application/octet-stream', 'Ocp-Apim-Subscription-Key': subscriptionKey},
    };

    const response = axios
      .post(url, blob, config)
      .then((res) => {
        this.detectedFaces = res.data;
        console.log(this.detectedFaces);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  public b64toBlob(b64DataStr: string, contentType = '', sliceSize = 512): Blob {
    const byteCharacters = atob(b64DataStr);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
  }

}
