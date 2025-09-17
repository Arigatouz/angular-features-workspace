import {Component, inject, Injector, resource, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatSliderModule} from '@angular/material/slider';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatDividerModule} from '@angular/material/divider';
import {TextFieldModule} from '@angular/cdk/text-field';
import {GoogleGenAiService} from '../../services/google-gen-ai';

@Component({
  selector: 'app-text-generation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSliderModule,
    MatProgressBarModule,
    MatDividerModule,
    TextFieldModule,
  ],
  providers: [GoogleGenAiService],
  templateUrl: './text-generation.html',
  styleUrl: './text-generation.scss'
})
export class TextGeneration {
  DEFAULT_TEXT = 'Write a 4 line poem about the sea.';
  readonly googleGenAiService = inject(GoogleGenAiService);
  readonly models = [
    {id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash'},
    {id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash'},
  ];

  fb = inject(NonNullableFormBuilder)
  form = this.fb.group({
    prompt: ['', [Validators.required, Validators.minLength(2)]],
    model: [this.models[0].id, Validators.required],
    temperature: [0.7],
    maxOutputTokens: [512, [Validators.min(1), Validators.max(8192)]],
  });

  protected loading = signal(false);
  protected output = signal('');
  protected generatedTextInput = signal(this.DEFAULT_TEXT);
  protected generatedOutPutText = signal('', {
    equal: (a, b) => a === b
  });
  readonly #injector = inject(Injector)

  generate() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.generatedTextInput.set(this.form.controls.prompt.value);
    const {prompt, model, temperature, maxOutputTokens} = this.form.getRawValue();

    const modelInitializer = resource({
      params: () => this.generatedTextInput(),
      loader: async ({params}) => {
        this.loading.set(true);
        const GenerateContentModel = await this.googleGenAiService.ai.models.generateContent({
          model: model || 'gemini-2.0-flash',
          contents: params,
          config: {
            temperature: temperature || 0.7,
            maxOutputTokens: maxOutputTokens || 512,
            thinkingConfig: {
              thinkingBudget: 0, // Disables thinking for lower cost and faster response
            }
          }
        });
        this.generatedOutPutText.set(GenerateContentModel.candidates?.[0].content?.parts?.[0].text || 'No response');
        this.output.set(
          `Model: ${model}\nTemperature: ${temperature}\nMax tokens: ${maxOutputTokens}\n\nResponse preview...\n(Connect Google model here)\n\n> ${prompt}\n\n${this.generatedOutPutText()} response Ended.`
        );
        this.loading.set(false);
        return GenerateContentModel.candidates?.[0].content?.parts?.[0].text;
      },
      injector: this.#injector

    })
  }

  clear() {
    this.output.set('');
    this.form.patchValue({prompt: ''});
  }

  stop() {
    // In a real integration, cancel an in-flight request/stream here.
    this.loading.set(false);
  }

  copy() {
    const text = this.output();
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {
    });
  }
}
