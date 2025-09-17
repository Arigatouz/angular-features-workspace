import { Injectable } from '@angular/core';
import {GoogleGenAI} from '@google/genai';
import {Environment} from '../Environment/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleGenAiService {
  ai = new GoogleGenAI({
    apiKey: Environment.GOOGLE_API_KEY
  })
}
