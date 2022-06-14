import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'مد استور';
  ngOnInit() { }
  data = [
    "Hello", "world", "normally", "you", "want", "more", "words",
    "than", "this"].map(function (d) {
      return { text: d, value: 10 + Math.random() * 90 };
    })
}
