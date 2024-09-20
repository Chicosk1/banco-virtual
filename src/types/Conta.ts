import { ValidaDebito, ValidaDeposito } from "./Decorators";
import { GrupoTransacao } from "./GrupoTransacao";
import { TipoTransacao } from "./TipoTransacao";
import { Armazenador } from "./Armazenador";
import { Transacao } from "./Transacao";

export class Conta{

    protected nome: string;
    protected saldo: number = Armazenador.obter<number>("saldo") || 0;
    private transacoes: Transacao[] = Armazenador.obter<Transacao[]>(("transacoes"), (key: string, value: any) => {

        if(key === "data"){
            return new Date(value);
        }
        return value;

    }) || [];

    constructor(nome: string) {
        this.nome = nome;
    }

    public getTitular(){
        return this.nome;
    }

    getGruposTransacoes(): GrupoTransacao[]{

        const gruposTransacoes: GrupoTransacao[] = [];
        const listaTransacoes: Transacao[] = structuredClone(this.transacoes);
        const transacoesOrdenadas: Transacao[] = listaTransacoes.sort((t1, t2) => t2.data.getTime() - t1.data.getTime());
        let labelAtualGrupoTransacao: string = "";

        for(let transacao of transacoesOrdenadas){

            let labelGrupoTransacao: string = transacao.data.toLocaleDateString("pt-br", { month: "long", year: "numeric" });

            if(labelAtualGrupoTransacao !== labelGrupoTransacao){

                labelAtualGrupoTransacao = labelGrupoTransacao;

                gruposTransacoes.push({

                    label: labelGrupoTransacao,
                    transacoes: []

                });
            }
            gruposTransacoes.at(-1).transacoes.push(transacao);
        }

        return gruposTransacoes;
    }

    getSaldo(){
        return this.saldo;
    }

    getDataAcesso(){
        return new Date();
    }

    registrarTransacao(novaTransacao: Transacao): void{

        if(novaTransacao.tipoTransacao == TipoTransacao.DEPOSITO){
            this.depositar(novaTransacao.valor);

        }else if(novaTransacao.tipoTransacao == TipoTransacao.TRANSFERENCIA ||
                 novaTransacao.tipoTransacao == TipoTransacao.PAGAMENTO_BOLETO){

            this.debitar(novaTransacao.valor);

            novaTransacao.valor *= -1;

        }else{

            throw new Error("Tipo de Transação é inválido!");

        }

        this.transacoes.push(novaTransacao);

        localStorage.setItem("transacoes", JSON.stringify(this.transacoes));

    }

    @ValidaDebito
    debitar(valor: number): void{
        this.saldo += valor;
        localStorage.setItem("saldo", this.saldo.toString());
    }
    
    @ValidaDeposito
    depositar(valor: number): void{
        this.saldo += valor;
        localStorage.setItem("saldo", this.saldo.toString());
    }
}

export class ContaPremium extends Conta{

    registrarTransacao(transacao: Transacao): void {

        if(transacao.tipoTransacao === TipoTransacao.DEPOSITO){

            console.log("ganhou um bônus de 0.50 centavos");

            transacao.valor += 0.5;

        }

        super.registrarTransacao(transacao);

    }
}

const conta = new Conta("Beatriz Samara Lopez");
const contaPremium = new ContaPremium("Gabriel Samudio Cichocki");
export default conta;
