import { z } from "zod";
import { ATS_SAFE_FONTS } from "./resume.defaults";
import { RESUME_TEMPLATE_IDS } from "./resume.types";

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const frontMatterSchema = z.looseObject({
  resume_version: z.coerce.number().int().positive().optional(),
  name: z.string().optional(),
  title: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  photo: z.string().optional(),
  template: z.enum(RESUME_TEMPLATE_IDS).optional(),
  accent_color: hexColorSchema.optional(),
  paper_color: hexColorSchema.optional(),
  text_color: hexColorSchema.optional(),
  font_family: z.string().optional(),
  heading_font_family: z.string().optional(),
  font_size: z.coerce.number().min(9).max(14).optional(),
  bullet_size: z.coerce.number().min(5).max(12).optional(),
  line_height: z.coerce.number().min(1.1).max(1.6).optional(),
  letter_spacing: z.coerce.number().min(-0.2).max(1).optional(),
  section_spacing: z.coerce.number().min(8).max(28).optional(),
  entry_spacing: z.coerce.number().min(2).max(16).optional(),
  page_margin: z.coerce.number().min(8).max(25).optional(),
  heading_size: z.coerce.number().min(9).max(16).optional(),
  page_size: z.enum(["A4", "LETTER"]).optional(),
  show_photo: z.boolean().optional(),
  photo_shape: z.enum(["square", "rounded", "circle"]).optional(),
  photo_zoom: z.coerce.number().min(1).max(2).optional(),
  photo_position_x: z.coerce.number().min(0).max(100).optional(),
  photo_position_y: z.coerce.number().min(0).max(100).optional(),
  section_order: z.array(z.string()).optional(),
  hidden_sections: z.array(z.string()).optional(),
  show_contact_icons: z.boolean().optional(),
  contact_icons: z
    .object({
      email: z.string().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      website: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
    })
    .optional(),
  custom_links: z
    .array(z.object({
      title: z.string().optional(),
      // Legacy fields remain accepted so older exported Markdown still imports.
      header: z.string().optional(),
      content: z.string().optional(),
      url: z.string().optional(),
      icon: z.string().optional(),
    }))
    .max(20)
    .optional(),
});

export const supportedFontSchema = z.enum(ATS_SAFE_FONTS);

export const emailSchema = z.email();

export const safeWebUrlSchema = z
  .url()
  .refine((value) => value.startsWith("https://") || value.startsWith("http://"));
