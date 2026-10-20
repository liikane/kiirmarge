// Windowsis ei tohi rakendus avaneda konsooliaknaga (ka debug-ehituses).
#![windows_subsystem = "windows"]

fn main() {
    kiirmarge_lib::run()
}