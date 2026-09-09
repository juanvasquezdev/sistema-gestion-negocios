export interface RespuestaPaginada<T> {
  data: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
}
