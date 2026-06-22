import N3 from "n3";

import type { Node, BlankNode, Literal, NamedNode, Term } from "../rdf-model.ts";
import type { RdfCollector, RdfReader } from "../rdf-reader.ts";

export function createStringN3RdfReader(): RdfReader<string> {
  return new StringN3RdfReader();
}

class StringN3RdfReader implements RdfReader<string> {
  parse(input: string, collector: RdfCollector): Promise<void> {
    const parser = new N3.Parser({});
    return new Promise((accept, reject) => {
      const callback = createCallback(accept, reject, collector);
      parser.parse(input, callback);
    });
  }
}

/**
 * @returns Callback that feeds all quads to the {@link collector}.
 */
function createCallback(
  accept: () => void,
  reject: (reason?: any) => void,
  collector: RdfCollector,
) {
  return (error: Error, quad: N3.Quad) => {
    if (error !== null) {
      reject(error);
      return;
    }
    if (error === null && quad === null) {
      accept();
      return;
    }
    const subject = convertSubject(quad.subject);
    const predicate = quad.predicate.value;
    const object = convertObject(quad.object);
    collector.consume(subject, predicate, object);
  };
}

function convertSubject(value: N3.Quad_Subject): Node | null {
  switch (value.termType) {
    case "NamedNode":
      return {
        termType: "NamedNode",
        value: value.value,
      } as NamedNode;
    case "BlankNode":
      return {
        termType: "BlankNode",
        value: value.value,
      } as BlankNode;
    default:
      console.error("Unknown value when parsing using n3:", value);
      return null;
  }
}

function convertObject(value: N3.Quad_Object): Term | null {
  switch (value.termType) {
    case "NamedNode":
      return {
        termType: "NamedNode",
        value: value.value,
      } as NamedNode;
    case "BlankNode":
      return {
        termType: "BlankNode",
        value: value.value,
      } as BlankNode;
    case "Literal":
      return {
        termType: "Literal",
        value: value.value,
        language: value.language === "" ? null : value.language,
        datatype: value.datatype,
      } as Literal;
    case "Variable":
    default:
      console.error("Unknown value when parsing using n3:", value);
      return null;
  }
}

export function createStreamN3RdfReader(): RdfReader<Stream> {
  return new StreamN3RdfReader();
}

class StreamN3RdfReader implements RdfReader<Stream> {
  parse(input: Stream, collector: RdfCollector): Promise<void> {
    return new Promise((accept, reject) => {
      const parser = new N3StreamReader(collector);
      parser
        .parse(input)
        .then(() => accept())
        .catch((error) => reject(error));
    });
  }
}

type Stream = ReadableStreamDefaultReader<Uint8Array>;

/**
 * Support for reading RDF stream.
 */
class N3StreamReader implements RdfReader<Stream> {
  protected readonly parser: N3.Parser;

  protected readonly consumer: RdfCollector;

  protected readonly decoder = new TextDecoder("utf-8");

  /**
   * Parser callback for when data ara available.
   */
  protected onData?: (data: string) => void;

  /**
   * Parser callback for end of the data.
   */
  protected onEnd?: () => void;

  constructor(consumer: RdfCollector, options?: N3.ParserOptions) {
    this.parser = new N3.Parser(options);
    this.consumer = consumer;
    this.initializeParser();
  }

  protected initializeParser() {
    const source = this.createCaptureSource();

    const callback = (error: Error, quad: N3.Quad) => {
      if (error !== null) {
        throw error;
      }
      if (quad !== null) {
        const subject = convertSubject(quad.subject);
        const predicate = quad.predicate.value;
        const object = convertObject(quad.object);
        this.consumer.consume(subject, predicate, object);
      }
      // We do not handle end of the stream here.
    };

    this.parser.parse(source as any, callback);
  }

  /**
   * Create and return source that only captures callbacks.
   */
  protected createCaptureSource() {
    return {
      on: (event: any, callback: any) => {
        switch (event) {
          case "data":
            this.onData = callback;
            break;
          case "end":
            this.onEnd = callback;
            break;
          case "error":
            // We do not need to capture error callback.
            break;
        }
      },
    };
  }

  public async parse(reader: ReadableStreamDefaultReader): Promise<void> {
    let readResult = await reader.read();
    while (!readResult.done) {
      const decoded = this.decoder.decode(readResult.value);
      this.onData?.(decoded);
      readResult = await reader.read();
    }
    this.onEnd?.();
  }
}
