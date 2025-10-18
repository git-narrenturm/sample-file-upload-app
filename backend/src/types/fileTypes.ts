import { Request } from "express";

import { File } from "@entities/File";

export type FileDTO = Omit<File, "data">;
