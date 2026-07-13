css_to_append = """
/* Custom Toaster Positioning */
[data-sonner-toaster][data-y-position="top"] {
  top: 20px !important;
  right: 20px !important;
  z-index: 99999 !important;
  pointer-events: auto !important;
}

@media (max-width: 768px) {
  [data-sonner-toaster][data-y-position="top"] {
    top: 16px !important;
    right: 12px !important;
    left: 12px !important;
    width: auto !important;
    max-width: none !important;
  }
}
"""

with open('src/index.css', 'a', encoding='utf-8') as f:
    f.write(css_to_append)
