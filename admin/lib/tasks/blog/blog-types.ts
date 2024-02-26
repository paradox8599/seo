export type BlogHeading = {
  heading: string;
  desc: string;
};

export type BlogBrief = {
  title: string;
  headings: BlogHeading[];
};

export type BlogSection = {
  heading: string;
  content: string;
};

export type BlogArticle = {
  title: string;
  desc: string;
  sections: BlogSection[];
};
