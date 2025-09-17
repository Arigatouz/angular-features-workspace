import {Component, OnInit, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {GoogleGenAI} from "@google/genai";
import {Environment} from './Environment/environment';
import {SideNavComponent} from './components/side-nav/side-nav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SideNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ai-agent');
  ai = new GoogleGenAI({
    apiKey: Environment.GOOGLE_API_KEY
  })

  googleInitialized = async (content: string) => {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: content,
      config: {
        temperature: 0,
        thinkingConfig: {
          thinkingBudget: 0, // Disables thinking for lower cost and faster response
        }
      }
    })
    response?.candidates?.[0].content?.parts?.forEach(p => console.log('final text =>', p.text))
    console.log('parts =>', response?.candidates?.[0].content?.parts)
    console.log('content =>', response?.candidates?.[0].content)
    console.log('candidates =>', response?.candidates)
    console.log('response =>', response)
  }

  async fireGoogle(content: string) {
    await this.googleInitialized(content);
  }
}
