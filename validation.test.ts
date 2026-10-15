import { describe, expect, it } from "vitest";
import { contactSchema, postSchema } from "../src/lib/validation";

describe("contactSchema", () => {
  it("accepts a valid message", () => {
    expect(contactSchema.safeParse({name:"A User",email:"a@example.com",subject:"Hello",message:"I would like to discuss a project."}).success).toBe(true);
  });
  it("rejects invalid email and short messages", () => {
    expect(contactSchema.safeParse({name:"A User",email:"not-an-email",subject:"Hi",message:"short"}).success).toBe(false);
  });
  it("rejects filled honeypot", () => {
    expect(contactSchema.safeParse({name:"A User",email:"a@example.com",subject:"Hello",message:"A sufficiently long message.",website:"spam"}).success).toBe(false);
  });
});

describe("postSchema", () => {
  it("rejects malformed slugs", () => {
    expect(postSchema.safeParse({title:"Poster",slug:"Bad Slug",description:"Desc",post_type:"image",media_path:"a.jpg",status:"draft"}).success).toBe(false);
  });
  it("rejects unknown post status", () => {
    expect(postSchema.safeParse({title:"Poster",slug:"poster",description:"Desc",post_type:"image",media_path:"a.jpg",status:"public"}).success).toBe(false);
  });
});
