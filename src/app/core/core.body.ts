import { Component } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { WebcamImage } from 'ngx-webcam';
import axios from 'axios';

@Component({
  selector: 'app-body',
  templateUrl: './core.body.html',
  styleUrls: ['./core.body.css']
})

export class BodyComponent {
  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();
  private capturedImage = null;
  public detectedFaces = [];
  public videoResults = [];
  public iframeElement = null;

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
    // this.makeAzureRequest(blob);

    this.getTagsFromFaceData(blob);
  }

  public getCapturedImage(): string {
    return this.capturedImage;
  }

  public getTagsFromFaceData(blob: Blob): void {
    const subscriptionKey = 'c86b0ac85e704428b4bc8f7baa4ebcb3';
    const url = 'https://pveta-faceapi.cognitiveservices.azure.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false&returnFaceAttributes=age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,blur,exposure,noise';
    const config = {
      headers: { 'content-type': 'application/octet-stream', 'Ocp-Apim-Subscription-Key': subscriptionKey },
    };

    const faceAPIResponse = axios
      .post(url, blob, config)
      .then((res) => {
        this.detectedFaces = res.data;

        console.log(res);

        const url = 'https://pveta-functionapp.azurewebsites.net/api/getTagsFromFaceData?code=28juiH7AqadOw2bGbFIv/u9jGXVDzUa1oM2XEp/Sto04lXlPthFP5g==';
        const suggestionsForFaceAttributesResponse = axios
          .post(url, { facesData: this.detectedFaces })
          .then((response) => {
            this.videoResults = response.data;

            let embedHtml = this.videoResults[0].embedHtml;
            embedHtml = embedHtml.replace('1280', '600');
            embedHtml = embedHtml.replace('720', '400');

            let domElement = document.getElementById('iframeContainer');
            domElement.innerHTML = embedHtml;
          })
          .catch((error) => {
            console.log('error in suggestionsForFaceAttributesResponse');
            console.log(error)
          });
      })
      .catch((error) => {
        console.log('error in faceAPIResponse');
        console.error(error);
      });
  }

  // public makeAzureRequest(blob: Blob): void {
  //   const subscriptionKey = '9cf77d3c9d92490cabeb9d89722303b5';
  //   const url = 'https://centralindia.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false&returnFaceAttributes=age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,blur,exposure,noise';

  //   const config = {
  //     headers: {'content-type': 'application/octet-stream', 'Ocp-Apim-Subscription-Key': subscriptionKey},
  //   };

  //   const response = axios
  //     .post(url, blob, config)
  //     .then((res) => {
  //       this.detectedFaces = res.data;
  //       console.log(this.detectedFaces);
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //     });
  // }

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

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

}
